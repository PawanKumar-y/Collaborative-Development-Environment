import './MyNav.css';
import {Link} from 'react-router-dom'
function MyNav()
{
    return(
        <nav className="outer">
            <div className="features">
                <Link to="/" className="Nav">Home</Link>
                <Link to="/execute" className="Nav">Execute Programs</Link>
                <Link to="/create-room" className="Nav">Collaborative Code</Link>
                <Link to="/interview-room" className="Nav">Interview Room</Link>
            </div>
            <div className="Auth">
                <Link to="/login" className="Nav">Log In</Link>
                <Link to="/signup" className="Nav">Sign Up</Link>
            </div>
        </nav>
    )
}
export default MyNav;