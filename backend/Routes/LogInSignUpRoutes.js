const express=require('express')
const route=express.Router()
const LoginController=require('../Controllers/LogInController')
const SignUpController=require('../Controllers/SignUpController')
const LoginFirebaseController=require('../Controllers/LogInFirebaseController')

route.post("/signup", SignUpController)
route.post("/login/basic", LoginController)
route.post("/login/firebase", LoginFirebaseController)

module.exports=route