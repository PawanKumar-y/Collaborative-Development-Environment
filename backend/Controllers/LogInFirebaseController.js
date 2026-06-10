const admin = require("../firebaseAdmin.js");
const { getAuth } =require("firebase-admin/auth");
const jwt = require("jsonwebtoken");
const User =require("../Collections/userCollection.js");

const LoginFirebaseController =async(req,res)=>{
   try{

      const { firebaseToken } = req.body;

      const decoded = await getAuth()
         .verifyIdToken(firebaseToken);

      const email = decoded.email;

      const found = await User.findOne({
         email: email
      });

      if(!found)
      {
         return res.status(400).json({
            status: "error",
            msg: "No user found with this email."
         });
      }

      const token = jwt.sign(
         { email },
         process.env.JWT_SECRET,
         { expiresIn: "1d" }
      );

      res.status(200).json({
         status: "success",
         msg: "Login successful",
         token
      });

   }
   catch(err)
   {
      console.log(err);

      res.status(401).json({
         status: "error",
         msg: "Invalid Firebase Token"
      });
   }
}

module.exports = LoginFirebaseController;