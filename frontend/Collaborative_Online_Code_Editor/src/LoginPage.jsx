import {useState,useContext} from 'react'
import {AuthContext} from './context/AuthProvider.jsx'
import './LoginPage.css'
import axios from 'axios'
import {Link} from 'react-router-dom'
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { signInWithPopup } from "firebase/auth";
import { auth, provider,githubProvider  } from "./firebase.js";
function LoginPage()
{
    const {authState, setAuth}=useContext(AuthContext);
    const googleLogin=async()=>{
        try
        {
            const result=await signInWithPopup(auth,provider);
            const token=await result.user.getIdToken()
            axios.post("http://localhost:5000/api/auth/login/firebase", {
                firebaseToken: token
            }).then((res)=>{
                setAuth({
                    email:result.user.email,
                    token: res.data.token
                });
                alert(res.data.msg);
            })
            .catch((err)=>{
                alert(err.response.data.msg);
            })
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
            const token = await result.user.getIdToken();
            axios.post("http://localhost:5000/api/auth/login/firebase",{
                firebaseToken:token
            }).then((res)=>{
                setAuth({
                    email:result.user.email,
                    token: res.data.token
                });
                alert(res.data.msg);
            }).catch((err)=>{
                alert(err.response.data.msg);
            })
        }
        catch(error)
        {
            console.log(error);
        }
    }

    const [email,setEmail]=useState("");
    const [password,setPassword]=useState("");
    const afterSubmit=(e)=>{
        e.preventDefault();
        const data={
            email: email,
            password: password
        }
        axios.post("http://localhost:5000/api/auth/login/basic",data)
        .then((res)=>{
            setAuth({
                email:email,
                token: res.data.token
            });
            alert(res.data.msg);
        })
        .catch((err)=>{
            alert(err.response.data.msg);
        })
    }
    return (
        <>
            {authState && authState.token ? (
                <div className="outerdiv">
                    <h2>Welcome {authState.email}!</h2>
                </div>
            ) : (
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
            )}
        </>
    )
}
export default LoginPage