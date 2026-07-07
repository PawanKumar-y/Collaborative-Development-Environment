const InterviewRoom=require('../Collections/interviewRoomCollection')
const Submission=require('../Collections/submissionCollection')

const adminRoomResultsController = async(req,res)=>{
    try
    {
        const email=req?.user.email
        if(!email)
        {
            return res.status(401).json({msg:"Unauthorized access."})
        }
        const {roomId}=req.params
        const room=await InterviewRoom.findOne({room_id:roomId,creator_id:email})
        if(!room)
        {
            return res.status(404).json({msg:"No room found for the specified user."})
        }

        const allResults=await Submission.find({_id:roomId})
        if(!allResults || allResults.length===0)
        {
            return res.status(404).json({msg:"No submissions found for this room."})
        }   
        return res.status(200).json({results:allResults})
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).json({msg:"Internal Server Error."   })
    }
}

module.exports=adminRoomResultsController