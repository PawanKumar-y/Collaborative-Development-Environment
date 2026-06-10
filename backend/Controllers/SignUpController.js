const bcrypt=require('bcrypt')
const User=require('../Collections/userCollection')

const SignUpController=async(req,res)=>{
    try
    {
        const {name,email,phone_number,password}=req.body
        if(!name || !email || !phone_number || !password){
            return res.status(400).json({
                status: "error",
                msg: "All fields are required."
            });
        }
        const check=await User.findOne({email:email});
        const check2=await User.findOne({phone_number:phone_number});
        if(check){
            return res.status(400).json({
                status: "error",
                msg: "An user already exists with this specified email."
            });
        }
        if(check2){
            return res.status(400).json({
                status: "error",
                msg: "An user already exists with this specified phone number."
            });
        }
        const salt=await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(password, salt);
        const nuser=new User({
            name:name,
            email:email,
            phone_number:phone_number,
            password:hashedPassword
        })
        await nuser.save();
        return res.status(201).json({
            status: "success",
            msg: "User registered successfully. Please log in and continue."
        });
    }
    catch(err)
    {
        return res.status(500).json({
            status: "error",
            msg: "Internal Server Error"
        });
    }
}