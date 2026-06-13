const { spawn } = require('child_process')

const dockerImages = {
    cpp: "gcc:latest",
    python: "python:3.11",
    c: "gcc:latest",
    java: "eclipse-temurin:17",
};

const getRunCommand = (language, code) => {
    const escaped = code.replace(/'/g, `'\\''`);
    switch (language) {
        case "python":
            return `echo '${escaped}' | python3`;
        case "cpp":
            return `echo '${escaped}' > main.cpp && g++ main.cpp -o main && ./main`;
        case "c":
            return `echo '${escaped}' > main.c && gcc main.c -o main && ./main`;
        case "java":
            return `echo '${escaped}' > Main.java && javac Main.java && java Main`;
        default:
            return `echo 'Unsupported language'`;
    }
};

const socketHandler = (io) => {
    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        let dockerProcess = null;

        socket.on("run", ({ language, code }) => {
            if (dockerProcess) {
                dockerProcess.kill();
                dockerProcess = null;
            }

            const image = dockerImages[language];
            const command = getRunCommand(language, code);

            dockerProcess = spawn("docker", [
                "run", "--rm", "-i",
                "--memory", "100m",       // max 100MB RAM
                "--cpus", "0.5",          // max 50% of one CPU core
                "--ulimit", "cpu=10",     // kill if uses more than 10 seconds of CPU
                image,
                "sh", "-c", command
            ]);
            
            const timeout = setTimeout(() => {
                if (dockerProcess) {
                    dockerProcess.kill();
                    socket.emit("output", "\r\nProcess timed out after 10 seconds.");
                }
            }, 10000);
            
            dockerProcess.stdout.on("data", (data) => {
                socket.emit("output", data.toString());
            });

            dockerProcess.stderr.on("data", (data) => {
                socket.emit("output", data.toString());
            });

            dockerProcess.on("close", (code) => {
                clearTimeout(timeout)
                socket.emit("exit", code);
                dockerProcess = null;
            });
        });

        socket.on("input", (data) => {
            if (dockerProcess) {
                dockerProcess.stdin.write(data);
            }
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
            if (dockerProcess) dockerProcess.kill();
        });
    });
};

module.exports = socketHandler;

/*
io.on("connection") 
    - Fires once when a user opens the page/connects to the server
    - Gives us a socket object unique to that user
    - Everything inside here belongs to that one specific user

let dockerProcess = null
    - Each user gets their own dockerProcess variable
    - Starts as null because no program is running yet

socket.on("run")
    this is program execution 
    it has three possible outcomes 
    valid output stdout
    error stderr
    execution done so thats why three emit statements are there 
    - Fires every time the user clicks the Run button
    - if(dockerProcess) → if a program is already running, kill it first
    - Then spawn() starts a new Docker container and assigns it to dockerProcess
    - dockerProcess.stdout → streams program output back to the user's terminal
    - dockerProcess.stderr → streams compilation/runtime errors back to the user's terminal
    - dockerProcess.on("close") → when program finishes, notify frontend and reset dockerProcess to null

socket.on("input")
    this is to get runtime input from the client
    - Fires every time the user types in the xterm terminal
    - Writes the keystroke directly into the running Docker container's stdin
    - This is what makes cin, input(), Scanner work

socket.on("disconnect")
    once the disconnect is clicked when particular page dismounts socket connection closes
    - Fires once when the user closes the tab or navigates away
    - Kills the Docker container if it's still running
    - Prevents containers running forever and wasting server resources*/