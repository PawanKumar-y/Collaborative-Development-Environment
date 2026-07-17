const pty = require('node-pty');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { languageConfig } = require('../CodeRunner/languageConfig');

const socketHandler = (io) => {
    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        let ptyProcess = null;
        let currentTempDir = null;
        let timeout;

        const resetTimeout = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (ptyProcess) {
                    ptyProcess.kill();
                    socket.emit("output", "\r\nProcess timed out after 10 seconds.");
                }
            }, 10000);
        };

        const cleanupTempDir = () => {
            if (currentTempDir) {
                fs.rmSync(currentTempDir, { recursive: true, force: true });
                currentTempDir = null;
            }
        };

        socket.on("run", async ({ language, code }) => {
            if (ptyProcess) {
                ptyProcess.kill();
                ptyProcess = null;
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

            // Compile first if needed (cpp/c/java) — keep this non-PTY, it's non-interactive
            if (config.compileCmd) {
                const compileOk = await new Promise((resolve) => {
                    const { spawn } = require('child_process');
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

            // Spawn with a real PTY — note -t added for TTY allocation
            ptyProcess = pty.spawn("docker", [
                "run", "--rm", "-it",
                "--network", "none",
                "--memory", config.memory || "100m",
                "--cpus", "0.5",
                "--pids-limit", String(config.pidsLimit || 64),
                "-v", `${tempDir}:/box`,
                "-w", "/box",
                config.image,
                ...config.runCmd,
            ], {
                name: 'xterm-color',
                cols: 80,
                rows: 24,
                cwd: tempDir,
                env: process.env,
            });

            resetTimeout();

            ptyProcess.onData((data) => {
                socket.emit("output", data);
            });

            ptyProcess.onExit(({ exitCode }) => {
                clearTimeout(timeout);
                socket.emit("exit", exitCode);
                ptyProcess = null;
                cleanupTempDir();
            });
        });

        socket.on("input", (data) => {
            if (ptyProcess) {
                ptyProcess.write(data);
                resetTimeout();
            }
        });

        socket.on("resize", ({ cols, rows }) => {
            if (ptyProcess) {
                ptyProcess.resize(cols, rows);
            }
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
            if (ptyProcess) ptyProcess.kill();
            cleanupTempDir();
        });
    });
};

module.exports = socketHandler;