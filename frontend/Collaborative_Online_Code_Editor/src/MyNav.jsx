import './MyNav.css';
function MyNav({setIsLogin,setIsSignUp})
{
    return(
        <nav className="outer">
            <div className="features">
                <div className="Nav">Execute Programs</div>
                <div className="Nav">Create Room</div>
                <div className="Nav">Interview Room</div>
            </div>
            <div className="Auth">
                <div className="Nav" onClick={()=>(setIsLogin(true), setIsSignUp(false))} style={{ cursor: 'pointer' }}>Login</div>
                <div className="Nav" onClick={()=>(setIsSignUp(true), setIsLogin(false))} style={{ cursor: 'pointer' }}>SignUp</div>
            </div>
        </nav>
    )
}
export default MyNav;