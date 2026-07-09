const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { runInDocker } = require('./dockerRunner');
const { languageConfig } = require('./languageConfig');

function normalize(str) {
  return (str ?? '').replace(/\r\n/g, '\n').trim();
}

async function executeSubmission(language, sourceCode, testCases) {
  const config = languageConfig[language];
  if (!config) throw new Error(`Unsupported language: ${language}`);

  const tempDir = path.join(os.tmpdir(), `run-${crypto.randomUUID()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // Write source code directly to file — no shell escaping needed
    fs.writeFileSync(path.join(tempDir, config.filename), sourceCode, 'utf-8');

    if (config.compileCmd) {
      const compileResult = await runInDocker({
        image: config.image,
        cmd: config.compileCmd,
        tempDir,
        timeoutMs: 15000,
        memory: config.memory,
        pidsLimit: config.pidsLimit,
      });

      if (compileResult.exitCode !== 0 || compileResult.timedOut) {
        return testCases.map((_, i) => ({
          testCase: i + 1,
          passed: false,
          status: compileResult.timedOut ? 'Compilation Timeout' : 'Compilation Error',
          stdout: '',
          stderr: compileResult.stderr,
        }));
      }
    }

    // Run each test case against the same compiled binary / interpreter
    const results = [];
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];

      const runResult = await runInDocker({
        image: config.image,
        cmd: config.runCmd,
        tempDir,
        input: tc.input,
        timeoutMs: 10000,
        memory: config.memory,
        pidsLimit: config.pidsLimit,
      });

      let status;
      let passed = false;

      if (runResult.timedOut) {
        status = 'Time Limit Exceeded';
      } else if (runResult.exitCode !== 0) {
        status = 'Runtime Error';
      } else if (normalize(runResult.stdout) === normalize(tc.expectedOutput)) {
        status = 'Accepted';
        passed = true;
      } else {
        status = 'Wrong Answer';
      }

      results.push({
        testCase: i + 1,
        passed,
        status,
        stdout: runResult.stdout,
        stderr: runResult.stderr,
        expectedOutput: tc.expectedOutput,
      });
    }

    return results;
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

module.exports = { executeSubmission };