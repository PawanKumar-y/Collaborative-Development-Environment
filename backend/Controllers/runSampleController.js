const InterviewRoom = require('../Collections/interviewRoomCollection')
const { executeSubmission } = require('../CodeRunner/executeSubmission')

const runSampleController = async (req, res) => {
    try {
        const { roomId } = req.params
        const { sourceCode, language, questionId } = req.body

        if (!sourceCode || !language || !questionId) {
            return res.status(400).json({ error: 'sourceCode, language, and questionId are required' })
        }

        const room = await InterviewRoom.findById(roomId)
        if (!room) return res.status(404).json({ error: 'Room not found' })

        const question = room.questions.find(q => q._id.toString() === questionId)
        if (!question) return res.status(404).json({ error: 'Question not found' })

        const sampleCases = question.testCases.filter(tc => tc.isSample)
        const results = await executeSubmission(language, sourceCode, sampleCases)

        const formatted = results.map((r, i) => ({
            testCaseNumber: r.testCase,
            status: r.status,
            passed: r.passed,
            isSample: true,
            input: sampleCases[i].input,
            expectedOutput: sampleCases[i].expectedOutput,
            actualOutput: r.stdout,
            stderr: r.stderr
        }))

        res.json({ results: formatted })
    }
    catch (err) {
        console.error('Run error:', err)
        res.status(500).json({ error: 'Code execution failed' })
    }
}

module.exports = runSampleController