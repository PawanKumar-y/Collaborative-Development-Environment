import {useForm} from 'react-hook-form'
import './SignUpPage.css'
function SignUpPage()
{
    const {register,handleSubmit,reset,formState:{errors}} = useForm();
    const afterSubmit=(data)=>{
        alert(JSON.stringify(data, null, 2));
        reset();
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
                        type="password"
                        placeholder="Enter your Password"
                        className="inputTag"
                        {...register("password",{
                            required:"password cannot be empty",
                            validate:{
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
            </div>

        </div>
    )
}
export default SignUpPage