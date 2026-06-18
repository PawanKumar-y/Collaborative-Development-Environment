const Room = require('../Collections/roomCollection')
const bcrypt=require('bcrypt')
const  joinRoomController=async(req,res)=>{
    try
    {
        const {roomId}=req.params
        const {password}=req.body;
        const user_email=req?.user.email;

        if(!user_email)
        {
            return res.status(401).json({msg:"Unauthorised access"});
        }

        const found=await Room.findOne({room_id:roomId})

        if(!found){
            return res.status(404).json({msg:"No room found with specified room id"})
        }

        const isCreator=found.creator_id===user_email
        const isCollaborator=found.collaborators.some((c)=> c.user_id===user_email)
        if(isCreator || isCollaborator)
        {
            return res.status(200).json({
                msg:"Access granted",
                room_id:found.room_id,
                room_name:found.room_name
            })
        }


        if(!found.password)
        {
            found.collaborators.push({user_id:user_email,lastEditedAt:new Date()})
            await found.save()
            return res.status(200).json({
                msg:"Access granted",
                room_id:found.room_id,
                room_name:found.room_name
            })
        }

        if(!password){
            return res.status(401).json({msg:"Password Required."})
        }

        const isMatch=await bcrypt.compare(password,found.password);
        if (!isMatch) {
            return res.status(401).json({ msg: "Incorrect password." })
        }

        found.collaborators.push({ user_id: user_email, lastEditedAt: new Date() })
        await found.save()

        return res.status(200).json({
            msg: "Joined room.",
            room_id: found.room_id,
            room_name: found.room_name
        })
    }
    catch(err){
        return res.status(500).json({msg:"Internal Server Error"})
    }
}
module.exports = joinRoomController