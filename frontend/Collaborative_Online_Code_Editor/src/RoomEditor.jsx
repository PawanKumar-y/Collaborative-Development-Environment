import { useContext, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import Editor from '@monaco-editor/react'
import * as Y from 'yjs'
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
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
    const userColorRef = useRef('#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'))
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
    useEffect(() => {
    // Only initialize terminal when the ref is attached to DOM
        if (!terminalDivRef.current || !authState?.token || !joined) return;

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
        xtermRef.current.open(terminalDivRef.current); // Now the element exists!
        fitAddon.fit();
        fitAddonRef.current = fitAddon;
        
        const handleResize = () => fitAddon.fit();
        window.addEventListener("resize", handleResize);
        
        socketRef.current = io("http://localhost:5000",{
            auth: { token: authState?.token }
        });
        
        socketRef.current.on("output", (data) => {
            xtermRef.current?.write(data);
        });
        socketRef.current.on("exit", (code) => {
            xtermRef.current?.writeln(`\r\nProcess exited with code ${code}`);
        });
        socketRef.current.on("connect", () => {
            xtermRef.current?.writeln("connected to server");
        });
        socketRef.current.on("disconnect", () => {
            xtermRef.current?.writeln("Disconnected from server");
        });
        
        xtermRef.current.onData((data) => {
            xtermRef.current?.write(data);
            socketRef.current?.emit("input", data);
        });

        return () => {
            window.removeEventListener("resize", handleResize);
            xtermRef.current?.dispose();
            socketRef.current?.disconnect();
        };
    }, [joined,authState?.token]); // Empty dependency array - runs once on mount

    useEffect(() => {
        if (!authState.token) return;
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
    }, [roomId,authState.token])

    // useEffect(() => {
    //     if (!joined) return
    //     if (!authState.token) return;
    //     const ydoc = new Y.Doc()
    //     ydocRef.current = ydoc

    //     const provider = new SocketIOProvider(SERVER_URL, roomId, ydoc, {
    //         auth: { token: authState.token }
    //     })
    //     providerRef.current = provider
        
    //     provider.awareness.setLocalStateField('user', {
    //         name: authState.user?.name || 'Anonymous',
    //         color: userColorRef.current
    //     })

    //     const updatePresence = () => {
    //         const states = Array.from(provider.awareness.getStates().values())
    //         setCollaborators(states.map((s) => s.user).filter(Boolean))
    //     }
    //     provider.awareness.on('change', updatePresence)
    //     updatePresence()

    //     return () => {
    //         provider.awareness.off('change', updatePresence)
    //         provider.disconnect()
    //         ydoc.destroy()
    //     }
    // }, [joined, roomId, authState.user,authState.token])
    useEffect(() => {
        if (!joined || !authState.token) return

        const ydoc = new Y.Doc()
        ydocRef.current = ydoc

        const ySocket = io(SERVER_URL, { auth: { token: authState.token } })
        const awareness = new awarenessProtocol.Awareness(ydoc)

        // Mark remote-applied updates so we don't echo them back
        const REMOTE_ORIGIN = 'remote'

        ySocket.on('connect', () => {
            console.log('[Yjs] socket connected, requesting sync for', roomId)
            ySocket.emit('sync-step-0', { room: roomId })
        })

        ySocket.on('sync-step-1', ({ update }) => {
            console.log('[Yjs] received sync-step-1, applying initial state')
            const decoder = decoding.createDecoder(new Uint8Array(update))
            const state = decoding.readVarUint8Array(decoder)
            Y.applyUpdate(ydoc, state, REMOTE_ORIGIN)
        })

        ySocket.on('update', ({ update }) => {
            console.log('[Yjs] received remote update')
            Y.applyUpdate(ydoc, new Uint8Array(update), REMOTE_ORIGIN)
        })

        // Send local doc changes to server
        const onDocUpdate = (update, origin) => {
            if (origin === REMOTE_ORIGIN) return // don't echo back what we just received
            console.log('[Yjs] sending local update')
            ySocket.emit('update', { room: roomId, update: Array.from(update) })
        }
        ydoc.on('update', onDocUpdate)

        // Awareness (presence/cursors)
        awareness.setLocalStateField('user', {
            name: authState.user?.name || 'Anonymous',
            color: userColorRef.current
        })

        awareness.on('update', ({ added, updated, removed }) => {
            const changed = added.concat(updated, removed)
            const update = awarenessProtocol.encodeAwarenessUpdate(awareness, changed)
            ySocket.emit('awareness', { room: roomId, update: Array.from(update) })
        })

        ySocket.on('awareness', ({ update }) => {
            awarenessProtocol.applyAwarenessUpdate(awareness, new Uint8Array(update), null)
        })

        const updatePresence = () => {
            const states = Array.from(awareness.getStates().values())
            setCollaborators(states.map((s) => s.user).filter(Boolean))
        }
        awareness.on('change', updatePresence)
        updatePresence()

        // expose for handleEditorMount
        providerRef.current = { awareness, socket: ySocket }

        return () => {
            ydoc.off('update', onDocUpdate)
            awareness.off('change', updatePresence)
            awarenessProtocol.removeAwarenessStates(awareness, [ydoc.clientID], 'unmount')
            ySocket.disconnect()
            ydoc.destroy()
        }
    }, [joined, roomId, authState.user, authState.token])

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