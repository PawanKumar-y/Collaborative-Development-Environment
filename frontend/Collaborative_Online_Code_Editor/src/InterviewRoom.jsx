import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from './context/AuthProvider.jsx'
import CreateInterviewRoom from './CreateInterviewRoom.jsx'
import JoinInterviewRoom from './JoinInterviewRoom.jsx'
import InterviewRoomResults from './InterviewRoomResults.jsx'

function InterviewRoom() {
    const [view, setView] = useState('menu');
    const { authState } = useContext(AuthContext);

    if (!authState?.token) {
        return <p>Please <Link to="/login">Log In</Link> first</p>
    }

    if (view === 'menu') {
        return (
            <div className="app-card app-page-panel">
                <h2 className="app-heading">Interview Room</h2>
                <div className="button-row">
                    <button className="app-button app-button--success" onClick={() => setView('create')}>
                        Create Room
                    </button>
                    <button className="app-button app-button--info" onClick={() => setView('join')}>
                        Join Room
                    </button>
                    <button className="app-button app-button--info" onClick={() => setView('results')}>
                        View Results
                    </button>
                </div>
            </div>
        )
    }

    if (view === 'create') {
        return (
            <div className="app-card app-page-panel">
                <button className="app-button app-button--ghost" onClick={() => setView('menu')}>
                    &larr; Back
                </button>
                <CreateInterviewRoom />
            </div>
        )
    }

    if (view === 'join') {
        return (
            <div className="app-card app-page-panel">
                <button className="app-button app-button--ghost" onClick={() => setView('menu')}>
                    &larr; Back
                </button>
                <JoinInterviewRoom />
            </div>
        )
    }

    if (view === 'results') {
        return (
            <div className="app-card app-page-panel">
                <button className="app-button app-button--ghost" onClick={() => setView('menu')}>
                    &larr; Back
                </button>
                <InterviewRoomResults />
            </div>
        )
    }
}

export default InterviewRoom