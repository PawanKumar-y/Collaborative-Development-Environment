const InterviewRoom = require("../Collections/interviewRoomCollection.js")

const getInterviewRoomController = async (req, res) => {
    try {
        const { roomId } = req.params
        const found = await InterviewRoom.findById(roomId)

        if (!found) {
            return res.status(404).json({ msg: "Interview room not found." })
        }

        const isCreator = found.creator_id === req.user.email

        if (!isCreator) {
            if (found.participants.includes(req.user.email)) {
                return res.status(403).json({ msg: "You have already entered this room and cannot rejoin." })
            }
            found.participants.push(req.user.email)
            await found.save()
        }

        const sanitizedQuestions = found.questions.map(q => ({
            _id: q._id,
            title: q.title,
            description: q.description,
            testCases: isCreator
                ? q.testCases
                : q.testCases.filter(tc => tc.isSample)
        }))

        return res.status(200).json({
            data: {
                _id: found._id,
                room_name: found.room_name,
                duration_minutes: found.duration_minutes,
                willFinishAt: found.willFinishAt,
                questions: sanitizedQuestions,
                isCreator
            }
        })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ msg: "Internal Server Error." })
    }
}

module.exports = getInterviewRoomController