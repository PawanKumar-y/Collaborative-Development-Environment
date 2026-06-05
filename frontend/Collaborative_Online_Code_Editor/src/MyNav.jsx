function MyNav({setIsLogin})
{
    return(
        <nav className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '2rem', flex: 1 }}>
                <div className="nav">Execute Programs</div>
                <div className="nav">Create Room</div>
                <div className="nav">Interview Room</div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="nav" onClick={() => setIsLogin(true)} style={{ cursor: 'pointer' }}>Login</div>
                <div className="nav" onClick={() => setIsLogin(true)} style={{ cursor: 'pointer' }}>SignUp</div>
            </div>
        </nav>
    )
}
export default MyNav;