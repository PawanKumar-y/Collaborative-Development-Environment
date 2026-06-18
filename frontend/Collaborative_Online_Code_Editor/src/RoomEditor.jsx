import { useContext, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import Editor from '@monaco-editor/react'
import * as Y from 'yjs'
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { SocketIOProvider } from 'y-socket.io'
import { MonacoBinding } from 'y-monaco'
import { AuthContext } from './context/AuthProvider.jsx'
import {io} from 'socket.io-client'
// import Terminal from './Terminal.jsx'

const SERVER_URL = 'http://localhost:5000'

function RoomEditor() {
    const { roomId } = useParams()
    const { authState } = useContext(AuthContext)
    const [language, setLanguage] = useState("cpp");
    //const [code, setCode] = useState("// Start typing your code here");

    const [needsPassword, setNeedsPassword] = useState(false)
    const [passwordInput, setPasswordInput] = useState('')
    const [joined, setJoined] = useState(false)
    const [roomInfo, setRoomInfo] = useState(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [collaborators, setCollaborators] = useState([])
    const [saveStatus, setSaveStatus] = useState('saved')

    const terminalDivRef=useRef(null);
    const xtermRef=useRef(null);
    const fitAddonRef=useRef(null);
    const socketRef=useRef(null);

    const editorRef = useRef(null)
    const ydocRef = useRef(null)
    const providerRef = useRef(null)
    const joinRoom = async (password) => {
        try {
            await axios.post(
                `http://localhost:5000/api/rooms/joinroom/${roomId}`,
                { password },
                { headers: { Authorization: `Bearer ${authState.token}` } }
            )
            setJoined(true)
            setNeedsPassword(false)
            setLoading(false)
        } catch (err) {
            setError(err.response?.data?.msg || 'Incorrect password')
            setLoading(false)
        }
    }
    useEffect(()=>{
        xtermRef.current=new Terminal({
            cursorBlink:true,
            fontSize:14,
            fontFamily: "Menlo, Monaco, 'Courier New', monospace",
            convertEol: true,
            theme: {
                background: "#1e1e1e",
                foreground: "#d4d4d4",
                cursor: "#d4d4d4",
                selectionBackground: "#264f78",
            },
        });
        const fitAddon=new FitAddon();
        xtermRef.current.loadAddon(fitAddon)
        xtermRef.current.open(terminalDivRef.current);
        fitAddon.fit();
        fitAddonRef.current=fitAddon;
        const handleResize=()=>(fitAddon.fit())
        window.addEventListener("resize",handleResize);
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
    useEffect(() => {
        const checkAccess = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/rooms/particular/${roomId}`, {
                    headers: { Authorization: `Bearer ${authState.token}` }
                })
                setRoomInfo(res.data)
                if (res.data.already_member || !res.data.has_password) {
                    await joinRoom('')
                } else {
                    setNeedsPassword(true)
                    setLoading(false)
                }
            } catch (err) {
                setError(err.response?.data?.msg || 'Unable to load room')
                setLoading(false)
            }
        }
        checkAccess()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId])

    useEffect(() => {
        if (!joined) return

        const ydoc = new Y.Doc()
        ydocRef.current = ydoc

        const provider = new SocketIOProvider(SERVER_URL, roomId, ydoc, {
            auth: { token: authState.token }
        })
        providerRef.current = provider

        provider.awareness.setLocalStateField('user', {
            name: authState.user?.name || 'Anonymous',
            color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')
        })

        const updatePresence = () => {
            const states = Array.from(provider.awareness.getStates().values())
            setCollaborators(states.map((s) => s.user).filter(Boolean))
        }
        provider.awareness.on('change', updatePresence)
        updatePresence()

        return () => {
            provider.awareness.off('change', updatePresence)
            provider.disconnect()
            ydoc.destroy()
        }
    }, [joined, roomId, authState.token])

    const handleEditorMount = (editor, monaco) => {
        editorRef.current=editor
        const ydoc = ydocRef.current
        const provider = providerRef.current
        const ytext = ydoc.getText('monaco')

        new MonacoBinding(ytext, editor.getModel(), new Set([editor]), provider.awareness)

        editor.onDidChangeModelContent(() => setSaveStatus('unsaved'))

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            provider.socket.emit('save-room', { roomId })
            setSaveStatus('saved')
        })
    }

    if (loading) return <p>Loading room...</p>
    if (error) return <p style={{ color: 'red' }}>{error}</p>

    if (needsPassword) {
        return (
            <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
                <h2>Enter Room Password</h2>
                <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem' }}
                />
                <button onClick={() => joinRoom(passwordInput)} style={{ marginTop: '1rem' }}>
                    Join Room
                </button>
            </div>
        )
    }
    const executeProgram = () => {
        
        if (!xtermRef.current || !socketRef.current) return;
        // Clear terminal and show status
        xtermRef.current.clear();
        xtermRef.current.writeln(`Running ${language} program...`);
        const code=editorRef.current.getValue();
        //isFirstOutput.current=true;
        // Send code to backend via socket io

        socketRef.current.emit("run",{
            language,
            code,
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', borderBottom: '1px solid #ccc' }}>
                <h3>{roomInfo?.room_name}</h3>
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
                <div>
                    {collaborators.map((c, i) => (
                        <span
                            key={i}
                            title={c.name}
                            style={{
                                display: 'inline-block', background: c.color, borderRadius: '50%',
                                width: '28px', height: '28px', textAlign: 'center', lineHeight: '28px',
                                color: '#fff', marginLeft: '4px'
                            }}
                        >
                            {c.name?.charAt(0).toUpperCase()}
                        </span>
                    ))}
                </div>
                <span>{saveStatus === 'saved' ? 'Saved' : 'Unsaved changes'}</span>
            </div>

            <div style={{ display: 'flex', flex: 1 }}>
                <div style={{ flex: 2, borderRight: '1px solid #ccc' }}>
                    <Editor height="100%" defaultLanguage="cpp" onMount={handleEditorMount} theme="vs-dark" />
                </div>
                <div style={{ flex: 1 }}>
                    {/* <Terminal roomId={roomId} /> */}
                    <div ref={terminalDivRef} style={{ height: "100%", width: "100%" }} />
                </div>
            </div>
        </div>
    )
}

export default RoomEditor