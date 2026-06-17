const Room = require('../Collections/roomCollection')

const roomDetailsController = async (req, res) => {
    try {
        const { roomId } = req.params
        const user_email = req?.user.email

        if (!user_email) {
            return res.status(401).json({ msg: "Unauthorized access." })
        }

        const room = await Room.findOne({ room_id: roomId })
        if (!room) {
            return res.status(404).json({ msg: "Room not found." })
        }

        const already_member =
            room.creator_id === user_email ||
            room.collaborators?.some((c) => c.user_id === user_email)

        return res.status(200).json({
            room_name: room.room_name,
            has_password: !!room.password,
            already_member
        })
    } catch (err) {
        return res.status(500).json({ msg: "Internal Server Error." })
    }
}

module.exports = roomDetailsController
// const Room = require('../Collections/roomCollection')

// const roomDetailsController=async ( req, res )=>{
//     try
//     {
//         const creator_id=req?.user.email;
//         if(!creator_id)
//         {
//             return res.status(400).json({msg:"unauthorised access"})
//         }
//         const found=await Room.find({creator_id:creator_id});
//         if(!found)
//         {
//             return res.status(404).json({msg:"No rooms found with specified email."})
//         }
//         return res.status(200).json({data:found});
//     }
//     catch(err)
//     {
//         return res.status(500).json({msg:"Internal Server Error."});
//     }
// }

// module.exports=roomDetailsController