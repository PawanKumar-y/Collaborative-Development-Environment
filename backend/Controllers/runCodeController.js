const { executeSubmission } = require('../codeRunner/executeSubmission')
const InterviewRoom = require('../Collections/interviewRoomCollection')
const Submission = require('../Collections/submissionCollection')

const runCodeController = async (req, res) => {
    try {
        const { roomId } = req.params
        const { sourceCode, language, questionId } = req.body
        const email = req?.user?.email

        if (!email) return res.status(401).json({ error: 'Unauthorized access.' })
        if (!sourceCode || !language || !questionId) {
            return res.status(400).json({ error: 'sourceCode, language, and questionId are required' })
        }

        const room = await InterviewRoom.findById(roomId)
        if (!room) return res.status(404).json({ error: 'Room not found' })

        const question = room.questions.find(q => q._id.toString() === questionId)
        if (!question) return res.status(404).json({ error: 'Question not found' })

        const testCases = question.testCases
        if (!testCases || testCases.length === 0) {
            return res.status(400).json({ error: 'No test cases found for this question' })
        }

        const results = await executeSubmission(language, sourceCode, testCases)
        const passedCount = results.filter(r => r.passed).length

        await Submission.findOneAndUpdate(
            { room_id: roomId, question_id: questionId, user_id: email },
            {
                code: sourceCode,
                language,
                passed_count: passedCount,
                total_count: testCases.length,
                submitted_at: new Date()
            },
            { upsert: true, new: true }
        )

        const formatted = results.map((r, i) => ({
            testCaseNumber: r.testCase,
            status: r.status,
            passed: r.passed,
            isSample: testCases[i].isSample,
            input: testCases[i].isSample ? testCases[i].input : undefined,
            expectedOutput: testCases[i].isSample ? testCases[i].expectedOutput : undefined,
            actualOutput: testCases[i].isSample ? r.stdout : undefined,
            stderr: testCases[i].isSample ? r.stderr : undefined
        }))

        res.json({ passed_count: passedCount, total_count: testCases.length, results: formatted })
    }
    catch (err) {
        console.error('Execution error:', err)
        res.status(500).json({ error: 'Code execution failed' })
    }
}

module.exports = runCodeController