const Submission=require('../Collections/submissionCollection')

const checkRoomResultsController = async (req, res) =>{
    try
    {
        const email=req?.user.email
        if(!email)
        {
            return res.status(401).json({msg:"Unauthorized access."})
        }
        const {roomId}=req.params
        const submissions=await Submission.find({_id:roomId, user_id:email})
        if(!submissions || submissions.length===0)
        {
            return res.status(404).json({msg:"No submissions found for the specified user in this room."})
        }
        return res.status(200).json({submissions:submissions})
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).json({msg:"Internal Server Error."})
    }
}

module.exports = checkRoomResultsController