const bcrypt=require('bcrypt')
const User= require('../Collections/userCollection')
const jwt=require('jsonwebtoken')

const LoginController=async(req,res)=>{
    try
    {
        const {email,password}=req.body

        if(!email || !password)
        {
            return res.status(400).json({
                status: "error",
                msg: "Email and password are required"
            })
        }
        const found=await User.findOne({email:email})
        if(!found)
        {
            return res.status(400).json({
                status: "error",
                msg: "Invalid email or password"
            })
        }
        const isMatch=await bcrypt.compare(password,found.password)
        if(!isMatch)
        {
            return res.status(400).json({
                status: "error",
                msg: "Invalid email or password"
            })
        }
        const token=jwt.sign(
            {email:email},
            process.env.JWT_SECRET,
            {expiresIn:"1d"}
        )
        return res.status(200).json({
            status: "success",
            msg: "Login successful",
            token
        })
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).json({
            status: "error",
            msg: "Internal Server Error"
        })
    }
}
module.exports=LoginController