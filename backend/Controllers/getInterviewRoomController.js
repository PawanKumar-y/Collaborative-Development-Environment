const getInterviewRoomController = async (req, res) => {
    try {
        const { roomId } = req.params
        const found = await InterviewRoom.findById({_id:roomId})

        if (!found) {
            return res.status(404).json({ msg: "Interview room not found." })
        }

        const isCreator = found.creator_id.toString() === req.user.id

        const sanitizedQuestions = found.questions.map(q => ({
            _id: q._id,
            title: q.title,
            description: q.description,
            testCases: isCreator
                ? q.testCases   // creator sees everything
                : q.testCases.filter(tc => tc.isSample)   // participant sees samples only
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
        return res.status(500).json({ msg: "Internal Server Error." })
    }
}
module.exports = getInterviewRoomController