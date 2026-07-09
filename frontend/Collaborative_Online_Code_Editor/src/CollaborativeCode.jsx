import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from './context/AuthProvider.jsx'
import CreateRoom from './CreateRoom.jsx'
import api from './api/axiosInstance.js'

function CollaborativeCode() {
    const { authState } = useContext(AuthContext)
    const navigate = useNavigate()

    // 'menu' | 'create' | 'join'
    const [view, setView] = useState('menu')

    const [createdRoom, setCreatedRoom] = useState(null)
    const [roomDetails, setRoomDetails] = useState(false)
    const [copied, setCopied] = useState(false)

    const [myRooms, setMyRooms] = useState([])
    const [loadingRooms, setLoadingRooms] = useState(false)
    const [joinError, setJoinError] = useState('')

    const [linkInput, setLinkInput] = useState('')
    const [linkError, setLinkError] = useState('')

    if (!authState?.token) {
        return <p>Please <Link to="/login">Log In</Link> first</p>
    }

    const fetchMyRooms = async () => {
        setLoadingRooms(true)
        setJoinError('')
        try {
            const response = await api.get(
                '/api/rooms/mine',
                { headers: { Authorization: `Bearer ${authState.token}` } }
            )
            setMyRooms(response.data)
        } catch (error) {
            setJoinError(error.response?.data?.msg || 'Unable to load rooms')
        } finally {
            setLoadingRooms(false)
        }
    }

    const handleSelectRoom = (roomId) => {
        navigate(`/room/${roomId}`)
    }

    const handleCopy = (roomId) => {
        const link = `${window.location.origin}/room/${roomId}`
        navigator.clipboard.writeText(link)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }
    const handleJoinByLink = () => {
        setLinkError('')
        const trimmed = linkInput.trim()
        if (!trimmed) return

        // extract room id whether they pasted a full URL or just the bare id
        let roomId = trimmed
        try {
            if (trimmed.startsWith('http')) {
                const url = new URL(trimmed)
                const parts = url.pathname.split('/').filter(Boolean) // ['room', 'abc123']
                roomId = parts[1] || ''
            }
        } catch {
            setLinkError('That link looks invalid')
            return
        }

        if (!roomId) {
            setLinkError('Could not find a room ID in that link')
            return
        }
        navigate(`/room/${roomId}`)
    }
    // ---- MENU VIEW ----
    if (view === 'menu') {
        return (
            <div className="app-card app-page-panel" style={{ width: 'min(100%, 760px)' }}>
                <h2 className="app-heading">Collaborative Coding</h2>
                <div className="button-row">
                    <button className="app-button app-button--success" onClick={() => setView('create')}>
                        Create Room
                    </button>
                    <button
                        className="app-button app-button--info"
                        onClick={() => {
                            setView('join')
                            fetchMyRooms()
                        }}
                    >
                        Join Existing Room
                    </button>
                </div>
            </div>
        )
    }

    // ---- CREATE VIEW ----
    if (view === 'create') {
        if (!createdRoom) {
            return (
                <div className="app-card app-page-panel" style={{ width: 'min(100%, 760px)' }}>
                    <button className="app-button app-button--ghost" onClick={() => setView('menu')}>
                        &larr; Back
                    </button>
                    <CreateRoom onRoomCreated={(roomData) => setCreatedRoom(roomData)} />
                </div>
            )
        }

        const roomLink = `${window.location.origin}/room/${createdRoom.room_id}`

        return (
            <div className="app-card app-page-panel" style={{ width: 'min(100%, 760px)' }}>
                <h2 className="app-heading">Room Created: {createdRoom.room_name}</h2>

                <div className="form-row">
                    <label className="app-label">Shareable Link</label>
                    <div className="copy-row">
                        <input type="text" value={roomLink} readOnly className="text-input" />
                        <button className="app-button app-button--secondary" onClick={() => handleCopy(createdRoom.room_id)}>
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                {createdRoom.password && (
                    <div className="form-row">
                        <label className="app-label">Password</label>
                        <p>{createdRoom.password}</p>
                    </div>
                )}

                <div className="button-row">
                    <button className="app-button app-button--primary" onClick={() => navigate(`/room/${createdRoom.room_id}`)}>
                        Enter Room
                    </button>
                    <button className="app-button app-button--secondary" onClick={() => setRoomDetails(!roomDetails)}>
                        {roomDetails ? 'Hide' : 'See'} Room Details
                    </button>
                    <button className="app-button app-button--ghost" onClick={() => { setCreatedRoom(null); setView('menu') }}>
                        Back to Menu
                    </button>
                </div>

                {roomDetails && (
                    <div className="room-details">
                        <p><strong>Room ID:</strong> {createdRoom.room_id}</p>
                        <p><strong>Creator:</strong> {createdRoom.creator_id}</p>
                    </div>
                )}
            </div>
        )
    }

    // ---- JOIN VIEW ----
    if (view === 'join') {
        return (
            <div className="app-card app-page-panel" style={{ width: 'min(100%, 760px)' }}>
                <button className="app-button app-button--ghost" onClick={() => setView('menu')}>
                    &larr; Back
                </button>
                <h2 className="app-heading">Your Rooms</h2>

                {loadingRooms && <p>Loading rooms...</p>}
                {joinError && <p className="error-text">{joinError}</p>}

                {!loadingRooms && myRooms.length === 0 && !joinError && (
                    <p>You haven't created or joined any rooms yet.</p>
                )}
                <div className="form-row">
                    <label className="app-label">Have a room link or code?</label>
                    <div className="copy-row">
                        <input
                            type="text"
                            className="text-input"
                            placeholder="Paste room link or ID"
                            value={linkInput}
                            onChange={(e) => setLinkInput(e.target.value)}
                        />
                        <button className="app-button app-button--primary" onClick={handleJoinByLink}>
                            Join
                        </button>
                    </div>
                    {linkError && <p className="error-text">{linkError}</p>}
                </div>
                <hr style={{ margin: '1rem 0' }} />
                <p className="app-label">Or join your previous rooms:</p>
                <ul className="room-list">
                    {myRooms.map((room) => (
                        <li
                            key={room.room_id}
                            onClick={() => handleSelectRoom(room.room_id)}
                            className="room-list-item"
                        >
                            <strong>{room.room_name}</strong>
                            {room.last_modified && (
                                <span className="room-date">
                                    Last modified: {new Date(room.last_modified).toLocaleString()}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        )
    }

    return null
}

export default CollaborativeCode