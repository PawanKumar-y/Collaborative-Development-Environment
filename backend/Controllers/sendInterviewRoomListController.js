const interviewRoomCollection = require('../Collections/interviewRoomCollection');

const sendInterviewRoomListController = async (req, res) => {
    try
    {
        const user=req?.user.email
        if (!user) 
        {
            return res.status(401).json({ msg: "Unauthorized access." })
        }

        const rooms = await interviewRoomCollection.find({
            $or: [
                { creator_id: user },
                { participants: user }
            ]
        });
        if(!rooms || rooms.length === 0)
        {
            return res.status(404).json({ msg: "No interview rooms exist for the specified user." });
        }
        return res.status(200).json({rooms:rooms});
    }
    catch(err){
        console.error(err);
        return res.status(500).json({msg:"Internal Server Error."})
    }
}

module.exports = sendInterviewRoomListController