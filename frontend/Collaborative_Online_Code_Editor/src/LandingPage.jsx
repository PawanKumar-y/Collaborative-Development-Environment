function LandingPage(){
    return(
        <div style={{ padding: '4rem 2rem', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <h1>Welcome to CDE</h1>
            <p style={{ maxWidth: '700px', margin: '2rem auto' }}>
                This is a site where we can run and execute programs of different languages like C, C++, Python, Java, Javascript and more. 
                What makes our site unique is that we can create rooms where two or more people can join and collaborate together on the same code 
                at the same time, anywhere in the world. Just share a meeting link and password – anyone can join and collaborate with you.
                On top of this, we can use this platform to conduct online tests for interviews and one-on-one sessions.
                <br /><br />
                <strong>Wanna try? Please log in to your account first. If you're new, please sign up first.</strong>
            </p>
        </div>
    )
}
export default LandingPage