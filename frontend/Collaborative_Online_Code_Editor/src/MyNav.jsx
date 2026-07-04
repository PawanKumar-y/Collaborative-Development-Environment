import './MyNav.css';
import { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from './context/AuthProvider.jsx'

function MyNav() {
    const { authState, logout } = useContext(AuthContext)
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <nav className="outer">
            <div className="features">
                <Link to="/" className="Nav">Home</Link>
                <Link to="/execute" className="Nav">Execute Programs</Link>
                <Link to="/create-room" className="Nav">Collaborative Code</Link>
                <Link to="/interview-room" className="Nav">Interview Room</Link>
            </div>
            <div className="Auth">
                {authState?.token ? (
                    <>
                        <span className="Nav">Hi, {authState.email}</span>
                        <button className="Nav" onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
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