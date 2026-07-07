import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from './api/axiosInstance.js'

function CreateInterviewRoom() {
    const navigate = useNavigate()
    const [roomName, setRoomName] = useState('')
    const [duration, setDuration] = useState(60)
    const [questions, setQuestions] = useState([
        { title: '', description: '', testCases: [{ input: '', expectedOutput: '', isSample: true }] }
    ])
    const [error, setError] = useState('')
    const [creating, setCreating] = useState(false)
    const [createdRoom, setCreatedRoom] = useState(null)

    const addQuestion = () => {
        setQuestions([...questions, { title: '', description: '', testCases: [{ input: '', expectedOutput: '', isSample: true }] }])
    }

    const removeQuestion = (qIndex) => {
        setQuestions(questions.filter((_, i) => i !== qIndex))
    }

    const updateQuestion = (qIndex, field, value) => {
        const updated = [...questions]
        updated[qIndex][field] = value
        setQuestions(updated)
    }

    const addTestCase = (qIndex) => {
        const updated = [...questions]
        updated[qIndex].testCases.push({ input: '', expectedOutput: '', isSample: false })
        setQuestions(updated)
    }

    const removeTestCase = (qIndex, tcIndex) => {
        const updated = [...questions]
        updated[qIndex].testCases = updated[qIndex].testCases.filter((_, i) => i !== tcIndex)
        setQuestions(updated)
    }

    const updateTestCase = (qIndex, tcIndex, field, value) => {
        const updated = [...questions]
        updated[qIndex].testCases[tcIndex][field] = value
        setQuestions(updated)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!roomName.trim()) return setError('Room name is required')
        if (questions.some(q => !q.title.trim() || q.testCases.length === 0)) {
            return setError('Every question needs a title and at least one test case')
        }

        setCreating(true)
        try {
            const willFinishAt = new Date(Date.now() + Number(duration) * 60 * 1000).toISOString()
            const res = await api.post('/api/interview/create', {
                room_name: roomName,
                duration_minutes: Number(duration),
                questions,
                willFinishAt
            })
            setCreatedRoom(res.data.room)
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to create room')
        } finally {
            setCreating(false)
        }
    }

    if (createdRoom) {
        const roomLink = `${window.location.origin}/interview-room/${createdRoom._id}`
        return (
            <div className="app-card app-page-panel">
                <h2 className="app-heading">Room Created: {createdRoom.room_name}</h2>
                <div className="copy-row">
                    <input type="text" value={roomLink} readOnly className="text-input" />
                    <button className="app-button app-button--secondary" onClick={() => navigator.clipboard.writeText(roomLink)}>
                        Copy Link
                    </button>
                </div>
                <button className="app-button app-button--primary" onClick={() => navigate(`/interview-room/${createdRoom._id}`)}>
                    Enter Room
                </button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="app-page-panel">
            <h2 className="app-heading">Create Interview Room</h2>

            <div className="form-row">
                <label className="app-label">Room Name</label>
                <input className="text-input" value={roomName} onChange={(e) => setRoomName(e.target.value)} />
            </div>

            <div className="form-row">
                <label className="app-label">Duration (minutes)</label>
                <input type="number" className="text-input" value={duration} onChange={(e) => setDuration(e.target.value)} min="1" />
            </div>

            {questions.map((q, qIndex) => (
                <div key={qIndex} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', margin: '1rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h3>Question {qIndex + 1}</h3>
                        {questions.length > 1 && (
                            <button type="button" onClick={() => removeQuestion(qIndex)}>Remove Question</button>
                        )}
                    </div>

                    <div className="form-row">
                        <label className="app-label">Title</label>
                        <input
                            className="text-input"
                            value={q.title}
                            onChange={(e) => updateQuestion(qIndex, 'title', e.target.value)}
                        />
                    </div>

                    <div className="form-row">
                        <label className="app-label">Description</label>
                        <textarea
                            className="text-input"
                            rows={4}
                            value={q.description}
                            onChange={(e) => updateQuestion(qIndex, 'description', e.target.value)}
                        />
                    </div>

                    <h4>Test Cases</h4>
                    {q.testCases.map((tc, tcIndex) => (
                        <div key={tcIndex} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                            <input
                                placeholder="Input"
                                className="text-input"
                                value={tc.input}
                                onChange={(e) => updateTestCase(qIndex, tcIndex, 'input', e.target.value)}
                            />
                            <input
                                placeholder="Expected Output"
                                className="text-input"
                                value={tc.expectedOutput}
                                onChange={(e) => updateTestCase(qIndex, tcIndex, 'expectedOutput', e.target.value)}
                            />
                            <label style={{ whiteSpace: 'nowrap' }}>
                                <input
                                    type="checkbox"
                                    checked={tc.isSample}
                                    onChange={(e) => updateTestCase(qIndex, tcIndex, 'isSample', e.target.checked)}
                                />
                                Sample
                            </label>
                            {q.testCases.length > 1 && (
                                <button type="button" onClick={() => removeTestCase(qIndex, tcIndex)}>Remove test case</button>
                            )}
                        </div>
                    ))}
                    <button type="button" onClick={() => addTestCase(qIndex)}> Add Test Case</button>
                </div>
            ))}

            <button type="button" onClick={addQuestion} className="app-button app-button--secondary">
                + Add Question
            </button>

            {error && <p className="error-text">{error}</p>}

            <div className="button-row">
                <button type="submit" className="app-button app-button--primary" disabled={creating}>
                    {creating ? 'Creating...' : 'Create Interview Room'}
                </button>
            </div>
        </form>
    )
}

export default CreateInterviewRoom