const jwt=require('jsonwebtoken')

const verifyJWT=(req,res,next)=>{
    try
    {
        const authHeader=req.headers.authorization;
        if(!authHeader){
            return res.status(401).json({
                status:"error",
                msg:"Authorization is not found Invalid user."
            })
        }
        const token=authHeader.split(" ")[1];
        jwt.verify(token,process.env.JWT_SECRET,(err,decoded)=>{
            if(err){
                return res.status(403).json({
                    status:"error",
                    msg:"Invalid token or token expired."
                })
            }
            req.user=decoded
            next();
        })
    }
    catch(err)
    {
        return res.status(500).json({
            status:"error",
            msg:"Internal Server Error"
        })
    }
}
module.exports=verifyJWT