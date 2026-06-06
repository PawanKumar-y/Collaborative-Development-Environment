import {useState} from 'react'
import './LoginPage.css'
function LoginPage()
{
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
            </div>

        </div>
    )
}
export default LoginPage