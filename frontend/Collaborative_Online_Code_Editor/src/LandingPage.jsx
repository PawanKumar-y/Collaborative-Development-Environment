import './LandingPage.css'
import { Link } from 'react-router-dom'
function LandingPage(){
    return(
        <div className="outerdiv"> 
            <h1 className="heading">Welcome to CDE</h1>
            <p className="para">
                This is a site where we can run and execute programs of different languages like C, C++, Python, Java, Javascript and more. 
                What makes our site unique is that we can create rooms where two or more people can join and collaborate together on the same code 
                at the same time, anywhere in the world. Just share a meeting link and password - anyone can join and collaborate with you.
                On top of this, we can use this platform to conduct online tests for interviews and one-on-one sessions.
                <br /><br />
                <strong>Wanna try? Please log in to your account first. If you're new, please <Link style={{color: 'white'}} to='/signup'>sign up</Link> first.</strong>
            </p>
        </div>
    )
}
export default LandingPage