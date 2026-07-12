const mongoose=require('mongoose')

const connectDB=async()=>{
    mongoose.connect(process.env.MONGO_URI)
    .then(()=>(console.log("Mongoose conencted successfully.")))
    .catch((err)=>(console.log("Error occured while conencting to mongodb: ",err)))
}

module.exports=connectDB