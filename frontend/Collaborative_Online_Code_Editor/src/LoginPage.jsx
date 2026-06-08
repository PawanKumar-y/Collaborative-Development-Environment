import {useState} from 'react'
import './LoginPage.css'
import {Link} from 'react-router-dom'
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { signInWithPopup } from "firebase/auth";
import { auth, provider,githubProvider  } from "./firebase.js";
function LoginPage()
{
    const googleLogin=async()=>{
        try
        {
            const result=await signInWithPopup(auth,provider);
            console.log(result.user);
            alert("Google Sign In successful. Welcome "+result.user.displayName);
        }
        catch(err)
        {
            console.log(err);
            alert("Google Sign In failed. Please try again.");
        }
    }   
    const githubLogin = async () => {
        try
        {
            const result = await signInWithPopup(auth, githubProvider);

            console.log(result.user);

            alert("GitHub Login Successful");
        }
        catch(error)
        {
            console.log(error);
        }
    }

    const [email,setEmail]=useState();
    const [password,setPassword]=useState();
    const afterSubmit=(e)=>{
        e.preventDefault();
        const data={
            email: email,
            password: password
        }
        alert("The following details is sent to the backend. "+data)
    }
    return (
        <div className="outerdiv">
            <h1>Log in</h1>
            <div className="inputForm">
                <form>
                    <input 
                        className="inputTag"
                        type="email"
                        name="email"
                        required
                        onChange={(e)=>(setEmail(e.target.value))}
                        placeholder="Enter your registered Email Id."/>
                    <br></br>
                    <input 
                        className="inputTag"
                        type="password"
                        name="password"
                        required
                        onChange={(e)=>(setPassword(e.target.value))}
                        placeholder="Enter you password"/>
                    <br></br>
                    <button className="loginButton" type="submit" onClick={afterSubmit}>Log In</button>
                </form>
                <hr style={{margin:"1.2rem"}}></hr>
                <div className="socialLoginContainer">

                    <button type="button" className="socialButton googleBtn" onClick={googleLogin}>
                        <FcGoogle size={28}/>
                    </button>

                    <button type="button" className="socialButton githubBtn" onClick={githubLogin}>
                        <FaGithub size={28}/>
                    </button>

                </div>
                <p className="signuptext">Don't have an account? <Link style={{color: 'white'}} to="/signup">Sign up</Link></p>
            </div>

        </div>
    )
}
export default LoginPage