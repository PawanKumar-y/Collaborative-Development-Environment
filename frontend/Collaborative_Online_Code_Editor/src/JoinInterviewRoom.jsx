import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from './api/axiosInstance.js'

function JoinInterviewRoom() {
    const navigate = useNavigate()
    const [myRooms, setMyRooms] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [linkInput, setLinkInput] = useState('')
    const [linkError, setLinkError] = useState('')

    useState(() => {
        const fetchRooms = async () => {
            try {
                const res = await api.get('/api/interview/mine')
                setMyRooms(res.data)
            } catch (err) {
                setError(err.response?.data?.msg || 'Unable to load rooms')
            } finally {
                setLoading(false)
            }
        }
        fetchRooms()
    }, [])

    const handleJoinByLink = () => {
        setLinkError('')
        const trimmed = linkInput.trim()
        if (!trimmed) return

        let roomId = trimmed
        try {
            if (trimmed.startsWith('http')) {
                const url = new URL(trimmed)
                const parts = url.pathname.split('/').filter(Boolean)
                roomId = parts[1] || ''
            }
        } catch {
            setLinkError('That link looks invalid')
            return
        }

        if (!roomId) return setLinkError('Could not find a room ID in that link')
        navigate(`/interview-room/${roomId}`)
    }

    return (
        <div className="app-page-panel">
            <h2 className="app-heading">Join Interview Room</h2>

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
            <p className="app-label">Or pick from your rooms:</p>

            {loading && <p>Loading rooms...</p>}
            {error && <p className="error-text">{error}</p>}
            {!loading && myRooms.length === 0 && !error && <p>No interview rooms yet.</p>}

            <ul className="room-list">
                {myRooms.map((room) => (
                    <li
                        key={room.room_id}
                        className="room-list-item"
                        onClick={() => navigate(`/interview-room/${room.room_id}`)}
                    >
                        <strong>{room.room_name}</strong>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default JoinInterviewRoom