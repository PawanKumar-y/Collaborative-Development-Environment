import { useContext, useEffect, useState } from 'react'
import { AuthContext } from './context/AuthProvider.jsx'
import api from './api/axiosInstance.js'

function InterviewRoomResults() {
    const { authState } = useContext(AuthContext)
    const [rooms, setRooms] = useState([])
    const [loadingRooms, setLoadingRooms] = useState(true)
    const [roomsError, setRoomsError] = useState('')

    const [selectedRoom, setSelectedRoom] = useState(null)
    const [results, setResults] = useState(null)
    const [loadingResults, setLoadingResults] = useState(false)
    const [resultsError, setResultsError] = useState('')

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const res = await api.get('/api/interview/mine')
                const allRooms = res.data?.rooms ?? res.data
                const myRooms = Array.isArray(allRooms)
                    ? allRooms.filter(r => r.creator_id === authState?.email)
                    : []
                setRooms(myRooms)
            } catch (err) {
                if (err.response?.status === 404) {
                    setRooms([])
                } else {
                    setRoomsError(err.response?.data?.msg || 'Unable to load rooms')
                }
            } finally {
                setLoadingRooms(false)
            }
        }
        fetchRooms()
    }, [authState])

    const handleSelectRoom = async (room) => {
        setSelectedRoom(room)
        setResults(null)
        setResultsError('')
        setLoadingResults(true)
        try {
            const res = await api.get(`/api/interview/getAllResults/${room._id}`)
            setResults(res.data.results)
        } catch (err) {
            setResultsError(err.response?.data?.msg || 'Unable to load results')
        } finally {
            setLoadingResults(false)
        }
    }

    const questionTitleMap = {}
    if (selectedRoom?.questions) {
        selectedRoom.questions.forEach(q => { questionTitleMap[q._id] = q.title })
    }

    // Group by participant, then by question — keeping their BEST attempt
    // (highest passed_count) since users can submit multiple times.
    const grouped = {}
    if (results) {
        results.forEach(sub => {
            if (!grouped[sub.user_id]) grouped[sub.user_id] = {}
            const existing = grouped[sub.user_id][sub.question_id]
            if (!existing || sub.passed_count > existing.passed_count) {
                grouped[sub.user_id][sub.question_id] = sub
            }
        })
    }

    return (
        <div style={{ padding: '2rem' }}>
            {loadingRooms && <p>Loading your rooms...</p>}
            {roomsError && <p className="error-text">{roomsError}</p>}
            {!loadingRooms && rooms.length === 0 && !roomsError && (
                <p>You haven't created any rooms yet.</p>
            )}

            {!selectedRoom && (
                <div>
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 className="app-heading" style={{ marginBottom: '2rem' }}>Interview Rooms</h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
                        {rooms.map(room => (
                            <button
                                key={room._id}
                                onClick={() => handleSelectRoom(room)}
                                style={{
                                    padding: '1.5rem',
                                    backgroundColor: '#6c5ce7',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '1.1rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 15px rgba(108, 92, 231, 0.2)',
                                    ':hover': { backgroundColor: '#5f4fd6' }
                                }}
                                onMouseEnter={(e) => e.target.style.boxShadow = '0 6px 20px rgba(108, 92, 231, 0.3)'}
                                onMouseLeave={(e) => e.target.style.boxShadow = '0 4px 15px rgba(108, 92, 231, 0.2)'}
                            >
                                {room.room_name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {selectedRoom && (
                <div>
                    <button
                        className="app-button app-button--ghost"
                        onClick={() => { setSelectedRoom(null); setResults(null) }}
                        style={{ marginBottom: '1.5rem', padding: '0.75rem 1.5rem', fontSize: '1rem' }}
                    >
                        ← Back
                    </button>
                    <h2 className="app-heading" style={{ marginBottom: '1.5rem' }}>{selectedRoom.room_name}</h2>

                    {loadingResults && <p>Loading results...</p>}
                    {resultsError && <p className="error-text">{resultsError}</p>}

                    {results && Object.keys(grouped).length > 0 && (
                        <div style={{ overflowX: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                            <table className="results-table" style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
                                <thead style={{ backgroundColor: '#6c5ce7', color: 'white' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Participant</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Question</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Best Score</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Last Submitted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(grouped).map(([userId, qMap]) =>
                                        Object.entries(qMap).map(([qId, sub], idx) => (
                                            <tr key={`${userId}-${qId}`} style={{ borderBottom: '1px solid #eee', backgroundColor: idx % 2 === 0 ? '#f9f9f9' : '#fff' }}>
                                                <td style={{ padding: '1rem', color: '#333' }}>{userId}</td>
                                                <td style={{ padding: '1rem', color: '#333' }}>{questionTitleMap[qId] || qId}</td>
                                                <td style={{ padding: '1rem', color: '#6c5ce7', fontWeight: '600' }}>{sub.passed_count}/{sub.total_count}</td>
                                                <td style={{ padding: '1rem', color: '#666', fontSize: '0.95rem' }}>{new Date(sub.submitted_at).toLocaleString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default InterviewRoomResults