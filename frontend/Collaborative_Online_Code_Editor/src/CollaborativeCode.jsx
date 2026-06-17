import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { AuthContext } from './context/AuthProvider.jsx'
import CreateRoom from './CreateRoom.jsx'

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

    if (!authState?.token) {
        return <p>Please <Link to="/login">Log In</Link> first</p>
    }

    const fetchMyRooms = async () => {
        setLoadingRooms(true)
        setJoinError('')
        try {
            const response = await axios.get(
                'http://localhost:5000/api/rooms/mine',
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

    // ---- MENU VIEW ----
    if (view === 'menu') {
        return (
            <div style={{ maxWidth: '500px', margin: '2rem auto', textAlign: 'center' }}>
                <h2>Collaborative Coding</h2>
                <button onClick={() => setView('create')} style={{ margin: '0.5rem' }}>
                    Create Room
                </button>
                <button
                    onClick={() => {
                        setView('join')
                        fetchMyRooms()
                    }}
                    style={{ margin: '0.5rem' }}
                >
                    Join Existing Room
                </button>
            </div>
        )
    }

    // ---- CREATE VIEW ----
    if (view === 'create') {
        if (!createdRoom) {
            return (
                <div style={{ maxWidth: '500px', margin: '2rem auto' }}>
                    <button onClick={() => setView('menu')}>&larr; Back</button>
                    <CreateRoom onRoomCreated={(roomData) => setCreatedRoom(roomData)} />
                </div>
            )
        }

        const roomLink = `${window.location.origin}/room/${createdRoom.room_id}`

        return (
            <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
                <h2>Room Created: {createdRoom.room_name}</h2>

                <div style={{ marginBottom: '1rem' }}>
                    <label>Shareable Link</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" value={roomLink} readOnly style={{ flex: 1, padding: '0.5rem' }} />
                        <button onClick={() => handleCopy(createdRoom.room_id)}>
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                {createdRoom.password && (
                    <div style={{ marginBottom: '1rem' }}>
                        <label>Password</label>
                        <p>{createdRoom.password}</p>
                    </div>
                )}

                <button onClick={() => navigate(`/room/${createdRoom.room_id}`)}>
                    Enter Room
                </button>
                <button onClick={() => setRoomDetails(!roomDetails)}>
                    {roomDetails ? 'Hide' : 'See'} Room Details
                </button>
                <button onClick={() => { setCreatedRoom(null); setView('menu') }}>
                    Back to Menu
                </button>

                {roomDetails && (
                    <div>
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
            <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
                <button onClick={() => setView('menu')}>&larr; Back</button>
                <h2>Your Rooms</h2>

                {loadingRooms && <p>Loading rooms...</p>}
                {joinError && <p style={{ color: 'red' }}>{joinError}</p>}

                {!loadingRooms && myRooms.length === 0 && !joinError && (
                    <p>You haven't created or joined any rooms yet.</p>
                )}

                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {myRooms.map((room) => (
                        <li
                            key={room.room_id}
                            onClick={() => handleSelectRoom(room.room_id)}
                            style={{
                                padding: '0.75rem',
                                marginBottom: '0.5rem',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            <strong>{room.room_name}</strong>
                            {room.last_modified && (
                                <span style={{ marginLeft: '1rem', color: '#666' }}>
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