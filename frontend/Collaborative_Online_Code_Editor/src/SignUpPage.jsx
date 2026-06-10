import {useForm} from 'react-hook-form'
import './SignUpPage.css'
import axios from 'axios'
import {Link} from 'react-router-dom'
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { signInWithPopup } from "firebase/auth";
import { auth, provider,githubProvider  } from "./firebase.js";
function SignUpPage()
{
    const googleLogin = async()=>{
        try{
            const result = await signInWithPopup(auth,provider);
            setValue("name",result.user.displayName);
            setValue("email",result.user.email);
        }
        catch(err){
            console.log(err);
            alert("Google Sign In failed.");
        }
    } 
    const githubLogin = async()=>{
        try{
            const result = await signInWithPopup(auth,githubProvider);
            setValue("name",result.user.displayName);
            setValue("email",result.user.email);
        }
        catch(error)
        {
            console.log(error);
            alert("GitHub Sign In failed.");
        }
    }
    const {register,handleSubmit,setValue,reset,formState:{errors}} = useForm({mode:"onChange"});
    const afterSubmit=(data)=>{
        console.log(data);
        reset();
        axios.post("http://localhost:5000/api/auth/signup",data)
        .then((res)=>{
            alert(res.data.msg);
        })
        .catch((err)=>{
            alert(err.response.data.msg);
        })
    }
    return (
        <div className="outerdiv">
            <h1>Sign Up</h1>
            <div className="signUpForm">
                <form onSubmit={handleSubmit(afterSubmit)}>
                    <input 
                        type="text"
                        placeholder="Enter your Name"
                        className="inputTag"
                        {...register("name",{
                            required:"Name cannot be empty",
                        })}/>
                    {errors.name && <p>{errors.name.message}</p>}
                    <br></br>

                    <input 
                        type="email"
                        placeholder="Enter your Email Id"
                        className="inputTag"
                        {...register("email",{
                            required:"Email cannot be empty",
                            pattern:{
                                value: /^[^@ ]+@[^@ ]+\.[^@ .]{2,}$/,
                                message: "Email is not valid."
                            }
                        })}
                        />
                    {errors.email && <p>{errors.email.message}</p>}
                    <br></br>
                    
                    <input 
                        type="number"
                        placeholder="Enter your Phone Number"
                        className="inputTag"
                        {...register("phone_number",{
                            required:"Phone number cannot be empty",
                            pattern:{
                                value: /^[0-9]{10}$/,
                                message: "Phone number is not valid."
                            }
                        })}
                        />
                    {errors.phone_number && <p>{errors.phone_number.message}</p>}
                    <br></br>
                    
                    <input 
                        type="password"
                        placeholder="Enter your Password"
                        className="inputTag"
                        {...register("password",{
                            required:"password cannot be empty",
                            validate:{
                                checkLength:(value)=>(value.length>=8 || "Password must be at least 8 characters long."),
                                checkUpper:(value)=>(/[A-Z]/.test(value) || "Password must contain an uppercase letter"),
                                checkLower:(value)=>(/[a-z]/.test(value) || "Password must contain an lowercase letter"),
                                checkDigit:(value)=>(/[0-9]/.test(value) || "Password must contain an digit.")
                            }
                        })}
                        />
                    {errors.password && <p>{errors.password.message}</p>}

                   
                    <br></br>
                    
                    <button className="signUpButton" type="submit" >Sign Up</button>
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
                <p className="signuptext">Already have an account? <Link style={{color: 'white'}} to="/login">Log in</Link></p>
            </div>

        </div>
    )
}
export default SignUpPage