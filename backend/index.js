const express =require('express')
const cors=require('cors')
const connectDB=require('./dbconfig')
const LogInSignUpRoutes=require('./Routes/LogInSignUpRoutes')
const app=express()
app.use(cors())
app.use(express.json())

connectDB()

app.use("/api/auth",LogInSignUpRoutes);

app.listen(process.env.PORT || 5000,()=>(console.log("Server is running on port 5000")));