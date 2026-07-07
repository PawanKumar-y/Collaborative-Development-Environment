const { spawn } = require('child_process');

function runInDocker({ image, cmd, tempDir, input = '', timeoutMs = 10000 }) {
  return new Promise((resolve) => {
    const dockerArgs = [
      'run', '--rm', '-i',
      '--network', 'none',
      '--memory', '100m',
      '--cpus', '0.5',
      '--ulimit', 'cpu=10',
      '--pids-limit', '64',
      '-v', `${tempDir}:/box`,
      '-w', '/box',
      image,
      ...cmd,
    ];

    const proc = spawn('docker', dockerArgs);

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGKILL');
    }, timeoutMs);

    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));

    proc.on('close', (exitCode) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode, timedOut });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({ stdout: '', stderr: err.message, exitCode: -1, timedOut: false });
    });

    proc.stdin.write(input ?? '');
    proc.stdin.end();
  });
}

module.exports = { runInDocker };