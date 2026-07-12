import './MyNav.css';
import { useContext } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AuthContext } from './context/AuthProvider.jsx'

function MyNav() {
    const { authState, logout } = useContext(AuthContext)
    const navigate = useNavigate()
    const location = useLocation()

    // Matches /interview-room/<roomId> (the workspace) but NOT /interview-room itself (the menu)
    const inTestRoom = /^\/interview-room\/[^/]+$/.test(location.pathname)

    const handleLogout = () => {
        if (inTestRoom) return
        logout()
        navigate('/login')
    }

    const handleNavClick = (e) => {
        if (inTestRoom) {
            e.preventDefault()
        }
    }

    return (
        <nav className="outer">
            <div className="features">
                <Link to="/" className={`Nav${inTestRoom ? ' Nav--disabled' : ''}`} onClick={handleNavClick}>Home</Link>
                <Link to="/execute" className={`Nav${inTestRoom ? ' Nav--disabled' : ''}`} onClick={handleNavClick}>Execute Programs</Link>
                <Link to="/create-room" className={`Nav${inTestRoom ? ' Nav--disabled' : ''}`} onClick={handleNavClick}>Collaborative Code</Link>
                <Link to="/interview-room" className={`Nav${inTestRoom ? ' Nav--disabled' : ''}`} onClick={handleNavClick}>Interview Room</Link>
            </div>
            <div className="Auth">
                {authState?.token ? (
                    <>
                        <span className="Nav">Hi, {authState.email}</span>
                        <button
                            className="Nav"
                            onClick={handleLogout}
                            disabled={inTestRoom}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: inTestRoom ? 'not-allowed' : 'pointer',
                                opacity: inTestRoom ? 0.4 : 1
                            }}
                        >
                            Sign Out
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="Nav">Log In</Link>
                        <Link to="/signup" className="Nav">Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    )
}
export default MyNav;