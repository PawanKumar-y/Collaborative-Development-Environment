const InterviewRoom = require("../Collections/interviewRoomCollection.js")

const createInterviewRoomController = async (req, res)=>{
    try
    {
        const email=req?.user.email
        if(!email)
        {
            return res.status(401).json({msg:"Unauthorized access."})
        }
        const {room_name,duration_minutes,questions,willFinishAt}=req.body
        if(!room_name || !duration_minutes || !questions || !willFinishAt)
        {
            return res.status(400).json({msg:"Bad Request."})
        }
        const finishtime= new Date(willFinishAt)
        
        const newRoom=new InterviewRoom({
            room_name:room_name,
            creator_id:email,
            duration_minutes:duration_minutes,
            questions:questions,
            willFinishAt:finishtime
        })
        await newRoom.save()
        return res.status(201).json({msg:"Interview room created successfully.", room:newRoom})
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).json({msg:"Internal Server Error."})
    }
}
module.exports = createInterviewRoomController