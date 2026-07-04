import { useContext, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import * as Y from 'yjs'
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import * as awarenessProtocol from 'y-protocols/awareness'
import * as decoding from 'lib0/decoding'
import { MonacoBinding } from 'y-monaco'
import { AuthContext } from './context/AuthProvider.jsx'
import {io} from 'socket.io-client'
import api from './api/axiosInstance.js'

const SERVER_URL = import.meta.env.VITE_API_URL

function RoomEditor() {
    const { roomId } = useParams()
    const navigate = useNavigate()
    const { authState } = useContext(AuthContext)
    const [language, setLanguage] = useState("cpp");

    const [needsPassword, setNeedsPassword] = useState(false)
    const [passwordInput, setPasswordInput] = useState('')
    const [joined, setJoined] = useState(false)
    const [roomInfo, setRoomInfo] = useState(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [collaborators, setCollaborators] = useState([])
    const [saveStatus, setSaveStatus] = useState('saved')

    const [showDetails, setShowDetails] = useState(false)
    const [linkCopied, setLinkCopied] = useState(false)

    const terminalDivRef=useRef(null);
    const xtermRef=useRef(null);
    const fitAddonRef=useRef(null);
    const socketRef=useRef(null);
    const userColorRef = useRef('#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'))
    const editorRef = useRef(null)
    const ydocRef = useRef(null)
    const providerRef = useRef(null)

    const roomLink = `${window.location.origin}/room/${roomId}`

    const handleLeaveRoom = () => {
        navigate('/create-room')
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(roomLink)
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
    }

    const joinRoom = async (password) => {
        try {
            await api.post(`/api/rooms/joinroom/${roomId}`, { password })
            setJoined(true)
            setNeedsPassword(false)
            setLoading(false)
        } catch (err) {
            setError(err.response?.data?.msg || 'Incorrect password')
            setLoading(false)
        }
    }

    useEffect(() => {
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
        xtermRef.current.open(terminalDivRef.current);
        fitAddon.fit();
        fitAddonRef.current = fitAddon;

        const handleResize = () => fitAddon.fit();
        window.addEventListener("resize", handleResize);

        socketRef.current = io(SERVER_URL, {
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
        socketRef.current.on("connect_error", (err) => {
            if (err.message === "Authentication failed" || err.message.includes("jwt")) {
                localStorage.removeItem("token")
                localStorage.removeItem("user")
                window.location.href = "/login?expired=1"
            }
        })

        xtermRef.current.onData((data) => {
            xtermRef.current?.write(data);
            socketRef.current?.emit("input", data);
        });

        return () => {
            window.removeEventListener("resize", handleResize);
            xtermRef.current?.dispose();
            socketRef.current?.disconnect();
        };
    }, [joined, authState?.token]);

    useEffect(() => {
        if (!authState.token) return;
        const checkAccess = async () => {
            try {
                const res = await api.get(`/api/rooms/particular/${roomId}`)
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
    }, [roomId, authState.token])

    useEffect(() => {
        if (!joined || !authState.token) return

        const ydoc = new Y.Doc()
        ydocRef.current = ydoc

        const ySocket = io(SERVER_URL, { auth: { token: authState.token } })
        const awareness = new awarenessProtocol.Awareness(ydoc)

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

        ySocket.on("connect_error", (err) => {
            if (err.message === "Authentication failed" || err.message.includes("jwt")) {
                localStorage.removeItem("token")
                localStorage.removeItem("user")
                window.location.href = "/login?expired=1"
            }
        })

        const onDocUpdate = (update, origin) => {
            if (origin === REMOTE_ORIGIN) return
            console.log('[Yjs] sending local update')
            ySocket.emit('update', { room: roomId, update: Array.from(update) })
        }
        ydoc.on('update', onDocUpdate)

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
        editorRef.current = editor
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
        xtermRef.current.clear();
        xtermRef.current.writeln(`Running ${language} program...`);
        const code = editorRef.current.getValue();
        socketRef.current.emit("run", { language, code });
    };

    return (
        <div className="room-editor-shell">
            <div className="room-header">
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
                        <button className="app-button app-button--success" onClick={executeProgram}>Run Program</button>
                        <button className="app-button app-button--info" onClick={() => setShowDetails(!showDetails)}>
                            {showDetails ? 'Hide' : 'Room'} Details
                        </button>
                        <button className="app-button app-button--danger" onClick={handleLeaveRoom}>
                            Leave Room
                        </button>
                    </div>
                </div>
                <div className="collaborator-list">
                    {collaborators.map((c, i) => (
                        <span
                            key={i}
                            title={c.name}
                            className="collaborator-badge"
                            style={{ background: c.color }}
                        >
                            {c.name?.charAt(0).toUpperCase()}
                        </span>
                    ))}
                </div>
                <span className="save-status">{saveStatus === 'saved' ? 'Saved' : 'Unsaved changes'}</span>
            </div>

            {showDetails && (
                <div className="details-panel">
                    <div className="details-row">
                        <p><strong>Room Name:</strong> {roomInfo?.room_name}</p>
                        <p><strong>Room ID:</strong> {roomId}</p>
                    </div>
                    <div className="details-row details-copy-row">
                        <input type="text" value={roomLink} readOnly className="room-details-input" />
                        <button className="app-button app-button--secondary" onClick={handleCopyLink}>
                            {linkCopied ? 'Copied!' : 'Copy Link'}
                        </button>
                    </div>
                    <p className="details-heading"><strong>Currently in room ({collaborators.length}):</strong></p>
                    <ul className="collaborator-names">
                        {collaborators.map((c, i) => (
                            <li key={i} style={{ color: c.color }}>{c.name}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div style={{ display: 'flex', flex: 1 }}>
                <div style={{ flex: 2, borderRight: '1px solid #ccc' }}>
                    <Editor height="100%" defaultLanguage="cpp" onMount={handleEditorMount} theme="vs-dark" />
                </div>
                <div style={{ flex: 1 }}>
                    <div ref={terminalDivRef} style={{ height: "100%", width: "100%" }} />
                </div>
            </div>
        </div>
    )
}

export default RoomEditor