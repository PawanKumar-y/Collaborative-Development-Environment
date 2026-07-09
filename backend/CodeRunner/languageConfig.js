// const dockerImages = {
//   python: 'python:3.11',
//   cpp: 'gcc:latest',
//   c: 'gcc:latest',
//   java: 'eclipse-temurin:17',
// };
const dockerImages = {
  python: 'python:3.11-slim',
  cpp: 'gcc-slim:13',
  c: 'gcc-slim:13',
  java: 'eclipse-temurin:17-jdk-alpine',
};

const languageConfig = {
  python: {
    image: dockerImages.python,
    filename: 'main.py',
    compileCmd: null,
    runCmd: ['python3', 'main.py'],
  },
  cpp: {
    image: dockerImages.cpp,
    filename: 'main.cpp',
    compileCmd: ['g++', 'main.cpp', '-o', 'main'],
    runCmd: ['./main'],
  },
  c: {
    image: dockerImages.c,
    filename: 'main.c',
    compileCmd: ['gcc', 'main.c', '-o', 'main'],
    runCmd: ['./main'],
  },
  java: {
    image: dockerImages.java,
    filename: 'Main.java',
    compileCmd: ['javac', 'Main.java'],
    runCmd: ['java', 'Main'],
    memory: '256m',
    pidsLimit: 128,
  },
};

module.exports = { languageConfig };