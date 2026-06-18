const Room = require('../Collections/roomCollection')

const sendRoomListController=async(req,res)=>{
    try
    {
        const email=req?.user.email;
        if(!email)
        {
            return res.status(401).json({msg:"Unauthorised access."})
        }
        const rooms=await Room.find({
            $or:[
                    {creator_id:email},
                    {"collaborators.user_id":email}
            ]})
        if(!rooms){
            return res.status(404).json({msg:"No rooms exist with specifed email/creator_id"});
        }
        const data = rooms.map((r) => ({
            room_id: r.room_id,
            room_name: r.room_name,
            last_modified: r.lastModifiedAt  // ← matches frontend's room.last_modified
        }))
        return res.status(200).json(data)
    }   
    catch(err)
    {
        return res.status(500).json({msg:"Internal Server Error"})
    }
}
module.exports=sendRoomListController