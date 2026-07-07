import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import api from './api/axiosInstance.js'
import io from 'socket.io-client'

function InterviewRoomWorkspace() {
    const { roomId } = useParams()
    const [problem, setProblem] = useState(null)
    const [loading, setLoading] = useState(true)
    const [language, setLanguage] = useState('python')
    const [code, setCode] = useState('')
    const [output, setOutput] = useState('')
    const [testResults, setTestResults] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [socket, setSocket] = useState(null)

    // Fetch room/problem details
    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const res = await api.get(`/api/interview/details/${roomId}`)
                setProblem(res.data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchRoom()
    }, [roomId])

    // Set up socket connection for live "Run"
    useEffect(() => {
        const s = io(import.meta.env.VITE_SOCKET_URL, {
            query: { roomId }
        })

        s.on('output', (data) => setOutput((prev) => prev + data))
        s.on('exit', () => setOutput((prev) => prev + '\n[Process exited]'))

        setSocket(s)
        return () => s.disconnect()
    }, [roomId])

    const handleRun = () => {
        setOutput('') // clear terminal
        socket?.emit('run', { language, code })
    }

    const handleSubmit = async () => {
        setSubmitting(true)
        setTestResults(null)
        try {
            const res = await api.post(`/api/interview/run/${roomId}`, {
                sourceCode: code,
                language,
            })
            setTestResults(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <p>Loading room...</p>
    if (!problem) return <p>Room not found</p>

    return (
        <div className="interview-workspace" style={{ display: 'flex', height: '90vh' }}>
            {/* LEFT PANE */}
            <div className="problem-pane" style={{ width: '40%', overflowY: 'auto', padding: '1rem' }}>
                <h2>{problem.title}</h2>
                <p>{problem.description}</p>

                <h4>Sample Test Cases</h4>
                {problem.testCases
                    ?.filter((tc) => !tc.isHidden)
                    .map((tc, i) => (
                        <div key={i} className="testcase-block">
                            <strong>Input:</strong>
                            <pre>{tc.input}</pre>
                            <strong>Expected Output:</strong>
                            <pre>{tc.expectedOutput}</pre>
                        </div>
                    ))}

                {testResults && (
                    <div className="submit-results">
                        <h4>{testResults.allPassed ? ' All tests passed' : ' Some tests failed'}</h4>
                        {testResults.results.map((r) => (
                            <div key={r.testCase}>
                                Test {r.testCase}: {r.status}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* RIGHT PANE */}
            <div className="editor-pane" style={{ width: '60%', display: 'flex', flexDirection: 'column' }}>
                <div className="editor-toolbar">
                    <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                        <option value="python">Python</option>
                        <option value="cpp">C++</option>
                        <option value="c">C</option>
                        <option value="java">Java</option>
                    </select>
                    <button onClick={handleRun}>Run</button>
                    <button onClick={handleSubmit} disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                </div>

                <Editor
                    height="60%"
                    language={language}
                    value={code}
                    onChange={(value) => setCode(value ?? '')}
                    theme="vs-dark"
                />

                <div className="terminal-panel" style={{ height: '40%', background: '#111', color: '#0f0', padding: '0.5rem', overflowY: 'auto', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                    {output || 'Output will appear here...'}
                </div>
            </div>
        </div>
    )
}

export default InterviewRoomWorkspace