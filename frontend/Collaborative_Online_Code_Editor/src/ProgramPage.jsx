import './ProgramPage.css'
import Editor from "@monaco-editor/react";
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useState, useEffect, useRef } from 'react';
import {io} from 'socket.io-client'

function ProgramPage() {
    const [language, setLanguage] = useState("cpp");
    const [code, setCode] = useState("// Start typing your code here");

    //const isFirstOutput=useRef(null)
    const terminalDivRef = useRef(null);  // the DOM div xterm mounts into
    const xtermRef = useRef(null);        // xterm Terminal instance
    const fitAddonRef = useRef(null);     // fitAddon instance
    const socketRef = useRef(null);           // WebSocket instance

    useEffect(() => {
        // 1. Create the terminal object with all config
        xtermRef.current = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: "Menlo, Monaco, 'Courier New', monospace",
            convertEol: true,
            theme: {
                background: "#1e1e1e",
                foreground: "#d4d4d4",
                cursor: "#d4d4d4",
                selectionBackground: "#264f78",
            },
        });
        const fitAddon = new FitAddon();
        xtermRef.current.loadAddon(fitAddon);
        xtermRef.current.open(terminalDivRef.current);
        fitAddon.fit();
        fitAddonRef.current = fitAddon;
        xtermRef.current.writeln("Welcome to C.O.D.E terminal.\nRun a program to see output.");
        const handleResize = () => fitAddon.fit();
        window.addEventListener("resize", handleResize);

        socketRef.current = io("http://localhost:5000");
        //when backend sends output
        socketRef.current.on("output",(data)=>{
            // if(isFirstOutput.current)
            // {
            //     xtermRef.current?.clear();
            //     isFirstOutput.current=false;
            // }
            xtermRef.current?.write(data);
        })
        socketRef.current.on("exit",(code)=>{
            xtermRef.current?.writeln(`\r\nProcess exited with code ${code}`)
        })
        socketRef.current.on("connect",()=>{
            xtermRef.current?.writeln("connected to server");
        })
        socketRef.current.on("disconnect",()=>{
            xtermRef.current?.writeln("Disconnected from server")
        })
        //  When user types in terminal → send to backend via WebSocket
        xtermRef.current.onData((data) => {
            xtermRef.current?.write(data); 
            socketRef.current?.emit("input",data);
        });


        // 10. Cleanup when component unmounts
        return () => {
            window.removeEventListener("resize", handleResize);
            xtermRef.current.dispose();
            socketRef.current.disconnect();
        };
    }, []);

    const executeProgram = () => {
        
        if (!xtermRef.current || !socketRef.current) return;
        // Clear terminal and show status
        xtermRef.current.clear();
        xtermRef.current.writeln(`Running ${language} program...`);
        //isFirstOutput.current=true;
        // Send code to backend via socket io
        socketRef.current.emit("run",{
            language,
            code,
        });
    };

    return (
        <div className="codeExecutionPage">
            <div className="pageHeader">
                <div>
                    <h2>C.O.D.E's online compiler</h2>
                    <p>Write and preview code in a friendly editor with instant syntax support.</p>
                </div>
            </div>
            <div className="CodeExecutionPage">
                <section className="ProgramSide">
                    <div className="panelHeader">
                        <div>
                            <h3>Editor</h3>
                            <p>Select your language and start typing.</p>
                        </div>
                        <div className="toolbar">
                            <label htmlFor="language-dropdown">Language</label>
                            <select id="language-dropdown" value={language} onChange={(e) => setLanguage(e.target.value)}>
                                <option value="cpp">C++</option>
                                <option value="python">Python</option>
                                <option value="c">C</option>
                                <option value="java">Java</option>
                            </select>
                            <button className="execute" onClick={executeProgram}>Run Program</button>
                        </div>
                    </div>
                    <div className="editorWrapper">
                        <Editor
                            className="Editor"
                            height="100%"
                            language={language}
                            value={code}
                            onChange={(val) => setCode(val)}
                            theme="vs-dark"
                        />
                    </div>
                </section>
                <aside className="OutputSide">
                    <div className="panelHeader outputHeader">
                        <div>
                            <h3>Terminal</h3>
                            <p>See compilation results or printed output here.</p>
                        </div>
                    </div>
                    <div className="outputContent">
                        <div ref={terminalDivRef} style={{ height: "100%", width: "100%" }} />
                    </div>
                </aside>
            </div>
        </div>
    );
}

export default ProgramPage;