const mongoose=require('mongoose')

const connectDB=async()=>{
    mongoose.connect("mongodb://127.0.0.1:27017/CODE",)
    .then(()=>(console.log("Mongoose conencted successfully.")))
    .catch((err)=>(console.log("Error occured while conencting to mongodb: ",err)))
}

module.exports=connectDB