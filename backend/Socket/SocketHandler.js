const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { languageConfig } = require('../CodeRunner/languageConfig');

const socketHandler = (io) => {
    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        let dockerProcess = null;
        let currentTempDir = null;

        const cleanupTempDir = () => {
            if (currentTempDir) {
                fs.rmSync(currentTempDir, { recursive: true, force: true });
                currentTempDir = null;
            }
        };

        socket.on("run", async ({ language, code }) => {
            if (dockerProcess) {
                dockerProcess.kill();
                dockerProcess = null;
            }
            cleanupTempDir();

            const config = languageConfig[language];
            if (!config) {
                socket.emit("output", `\r\nUnsupported language: ${language}`);
                socket.emit("exit", 1);
                return;
            }

            const tempDir = path.join(os.tmpdir(), `interactive-${crypto.randomUUID()}`);
            fs.mkdirSync(tempDir, { recursive: true });
            currentTempDir = tempDir;

            fs.writeFileSync(path.join(tempDir, config.filename), code, 'utf-8');

            // Compile first if needed (cpp/c/java)
            if (config.compileCmd) {
                const compileOk = await new Promise((resolve) => {
                    const compileProc = spawn("docker", [
                        "run", "--rm",
                        "--network", "none",
                        "--memory", config.memory || "100m",
                        "--cpus", "0.5",
                        "--pids-limit", String(config.pidsLimit || 64),
                        "-v", `${tempDir}:/box`,
                        "-w", "/box",
                        config.image,
                        ...config.compileCmd,
                    ]);

                    let stderr = '';
                    compileProc.stderr.on("data", (d) => (stderr += d.toString()));
                    compileProc.on("close", (exitCode) => {
                        if (exitCode !== 0) {
                            socket.emit("output", `\r\nCompilation Error:\r\n${stderr}`);
                            socket.emit("exit", exitCode);
                        }
                        resolve(exitCode === 0);
                    });
                    compileProc.on("error", (err) => {
                        socket.emit("output", `\r\nDocker error: ${err.message}`);
                        resolve(false);
                    });
                });

                if (!compileOk) {
                    cleanupTempDir();
                    return;
                }
            }

            dockerProcess = spawn("docker", [
                "run", "--rm", "-i",
                "--network", "none",
                "--memory", config.memory || "100m",
                "--cpus", "0.5",
                "--ulimit", "cpu=10",
                "--pids-limit", String(config.pidsLimit || 64),
                "-v", `${tempDir}:/box`,
                "-w", "/box",
                config.image,
                ...config.runCmd,
            ]);

            const timeout = setTimeout(() => {
                if (dockerProcess) {
                    dockerProcess.kill('SIGKILL');
                    socket.emit("output", "\r\nProcess timed out after 10 seconds.");
                }
            }, 10000);

            dockerProcess.stdout.on("data", (data) => {
                socket.emit("output", data.toString());
            });

            dockerProcess.stderr.on("data", (data) => {
                socket.emit("output", data.toString());
            });

            dockerProcess.on("close", (exitCode) => {
                clearTimeout(timeout);
                socket.emit("exit", exitCode);
                dockerProcess = null;
                cleanupTempDir();
            });

            dockerProcess.on("error", (err) => {
                clearTimeout(timeout);
                socket.emit("output", `\r\nDocker error: ${err.message}`);
                dockerProcess = null;
                cleanupTempDir();
            });
        });

        socket.on("input", (data) => {
            if (dockerProcess) {
                dockerProcess.stdin.write(data);
            }
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
            if (dockerProcess) dockerProcess.kill('SIGKILL');
            cleanupTempDir();
        });
    });
};

module.exports = socketHandler;