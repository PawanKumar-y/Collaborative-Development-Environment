import { useState, useEffect } from 'react'
import { useParams,useNavigate  } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import api from './api/axiosInstance.js'

function InterviewRoomWorkspace() {
    const { roomId } = useParams()
    const navigate = useNavigate()
    const [problem, setProblem] = useState(null)
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [language, setLanguage] = useState('cpp')
    const [code, setCode] = useState('')
    const [runResults, setRunResults] = useState(null)
    const [submitResults, setSubmitResults] = useState(null)
    const [running, setRunning] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const currentQuestion = problem?.questions?.[activeQuestionIndex]

    const [entryError, setEntryError] = useState('')

    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const res = await api.get(`/api/interview/details/${roomId}`)
                setProblem(res.data.data)
            } catch (err) {
                console.error(err)
                if (err.response?.status === 403) {
                    setEntryError(err.response.data?.msg || "You can't re-enter this room.")
                }
            } finally {
                setLoading(false)
            }
        }
        fetchRoom()
    }, [roomId])

    const handleRun = async () => {
        setRunning(true)
        setRunResults(null)
        try {
            const res = await api.post(`/api/interview/run-sample/${roomId}`, {
                sourceCode: code,
                language,
                questionId: currentQuestion._id
            })
            setRunResults(res.data.results)
        } catch (err) {
            console.error(err)
        } finally {
            setRunning(false)
        }
    }

    const handleSubmit = async () => {
        setSubmitting(true)
        setSubmitResults(null)
        try {
            const res = await api.post(`/api/interview/run/${roomId}`, {
                sourceCode: code,
                language,
                questionId: currentQuestion._id
            })
            setSubmitResults(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setSubmitting(false)
        }
    }
    const handleFinish = () => {
        if(submitResults===null)
        {
            alert('Please submit your solution before clicking Finish Test.')
        }
        else {
            navigate('/interview-room')
        }
    }
    if (loading) return <p>Loading room...</p>
    if (entryError) return <p>{entryError}</p>
    if (!problem) return <p>Room not found</p>
    

    const renderResultRow = (r) => (
    <div
        key={r.testCaseNumber}
        style={{
            padding: '1rem',
            marginBottom: '0.75rem',
            borderRadius: '6px',
            background: r.passed ? '#e8f5e9' : '#ffebee',
            color: r.passed ? '#2e7d32' : '#c62828',
            border: `1px solid ${r.passed ? '#a5d6a7' : '#ef9a9a'}`
        }}
    >
        <strong style={{ fontSize: '1rem' }}>
            Test Case {r.testCaseNumber}{r.isSample ? ' (sample)' : ''}: {r.status}
        </strong>
        {r.input !== undefined && (
            <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: '#555' }}>
                <div style={{ marginBottom: '0.3rem' }}><strong>Input:</strong> <code style={{ backgroundColor: '#f5f5f5', padding: '0.25rem 0.5rem', borderRadius: '3px' }}>{r.input}</code></div>
                <div style={{ marginBottom: '0.3rem' }}><strong>Expected:</strong> <code style={{ backgroundColor: '#f5f5f5', padding: '0.25rem 0.5rem', borderRadius: '3px' }}>{r.expectedOutput}</code></div>
                <div style={{ marginBottom: '0.3rem' }}><strong>Got:</strong> <code style={{ backgroundColor: '#f5f5f5', padding: '0.25rem 0.5rem', borderRadius: '3px' }}>{r.actualOutput}</code></div>
                {r.stderr && <div><strong>Stderr:</strong> <code style={{ backgroundColor: '#f5f5f5', padding: '0.25rem 0.5rem', borderRadius: '3px' }}>{r.stderr}</code></div>}
            </div>
        )}
    </div>
)

    return (
        <div style={{ display: 'flex', height: '90vh' }}>
            <div style={{ width: '40%', overflowY: 'auto', padding: '1.5rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                {problem.questions.length > 1 && (
                    <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {problem.questions.map((q, i) => (
                            <button
                                key={q._id}
                                onClick={() => { setActiveQuestionIndex(i); setRunResults(null); setSubmitResults(null) }}
                                style={{
                                    padding: '0.5rem 1rem',
                                    fontWeight: i === activeQuestionIndex ? '600' : '500',
                                    backgroundColor: i === activeQuestionIndex ? '#6c5ce7' : '#e8e8ff',
                                    color: i === activeQuestionIndex ? '#fff' : '#6c5ce7',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    fontSize: '0.95rem'
                                }}
                            >
                                Q{i + 1}
                            </button>
                        ))}
                    </div>
                )}

                <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1a1a1a' }}>{activeQuestionIndex+1}. {currentQuestion?.title}</h2>
                    <p style={{ lineHeight: '1.6', color: '#444', fontSize: '1rem' }}>{currentQuestion?.description}</p>
                </div>

                <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <h4 style={{ marginBottom: '1rem', color: '#1a1a1a', fontSize: '1.1rem' }}>Sample Test Cases</h4>
                    {currentQuestion?.testCases
                        ?.filter((tc) => tc.isSample)
                        .map((tc, i) => (
                            <div key={i} style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f5f7ff', borderRadius: '6px', border: '1px solid #e0e8ff' }}>
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <strong style={{ color: '#6c5ce7', display: 'block', marginBottom: '0.25rem' }}>Input:</strong>
                                    <pre style={{ backgroundColor: '#fff', padding: '0.75rem', borderRadius: '4px', overflow: 'auto', border: '1px solid #ddd', color: '#333', fontSize: '0.9rem' }}>{tc.input}</pre>
                                </div>
                                <div>
                                    <strong style={{ color: '#6c5ce7', display: 'block', marginBottom: '0.25rem' }}>Expected Output:</strong>
                                    <pre style={{ backgroundColor: '#fff', padding: '0.75rem', borderRadius: '4px', overflow: 'auto', border: '1px solid #ddd', color: '#333', fontSize: '0.9rem' }}>{tc.expectedOutput}</pre>
                                </div>
                            </div>
                        ))}
                </div>

                {runResults && (
                    <div style={{ marginTop: '1.5rem', backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ marginBottom: '1rem', color: '#1a1a1a', fontSize: '1.1rem' }}>Run Results (samples only)</h4>
                        {runResults.map(renderResultRow)}
                    </div>
                )}

                {submitResults && (
                    <div style={{ marginTop: '1.5rem', backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ marginBottom: '1rem', color: '#1a1a1a', fontSize: '1.1rem' }}>Submission: <span style={{ color: '#6c5ce7' }}>{submitResults.passed_count}/{submitResults.total_count}</span> passed</h4>
                        {submitResults.results.map(renderResultRow)}
                    </div>
                )}
            </div>

            <div style={{ width: '60%', display: 'flex', flexDirection: 'column' }}>
                <div className="editor-toolbar" style={{ display: 'flex', gap: '1rem', padding: '1rem', backgroundColor: '#2d2d2d', borderBottom: '1px solid #444', alignItems: 'center' }}>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ padding: '0.6rem 0.75rem', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#3d3d3d', color: '#fff', fontSize: '0.95rem', fontWeight: '500', cursor: 'pointer' }}>
                        <option value="cpp">C++</option>
                        <option value="python">Python</option>
                        <option value="c">C</option>
                        <option value="java">Java</option>
                    </select>
                    <button onClick={handleRun} disabled={running} style={{ padding: '0.6rem 1.25rem', backgroundColor: '#4ecdc4', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', transition: 'all 0.3s ease', opacity: running ? 0.6 : 1 }}>{running ? 'Running...' : 'Run'}</button>
                    <button onClick={handleSubmit} disabled={submitting} style={{ padding: '0.6rem 1.25rem', backgroundColor: '#6c5ce7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', transition: 'all 0.3s ease', opacity: submitting ? 0.6 : 1 }}>{submitting ? 'Submitting...' : 'Submit'}</button>
                    <button onClick={handleFinish} style={{ padding: '0.6rem 1.25rem', backgroundColor: '#ff6b6b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', transition: 'all 0.3s ease', marginLeft: 'auto' }}>Finish</button>
                </div>

                <Editor
                    height="100%"
                    language={language}
                    value={code}
                    onChange={(value) => setCode(value ?? '')}
                    theme="vs-dark"
                />
            </div>
        </div>
    )
}

export default InterviewRoomWorkspace