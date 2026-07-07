const { executeSubmission } = require('../codeRunner/executeSubmission');
const InterviewRoom = require('../Collections/interviewRoomCollection');

const runCodeController = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { sourceCode, language } = req.body;

    if (!sourceCode || !language) {
      return res.status(400).json({ error: 'sourceCode and language are required' });
    }

    const room = await InterviewRoom.findOne({ roomId });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const testCases = room.testCases;
    if (!testCases || testCases.length === 0) {
      return res.status(400).json({ error: 'No test cases found for this room' });
    }

    const results = await executeSubmission(language, sourceCode, testCases);
    const allPassed = results.every((r) => r.passed);

    res.json({ allPassed, results });
  } 
  catch (err) 
  {
    console.error('Execution error:', err);
    res.status(500).json({ error: 'Code execution failed' });
  }
};

module.exports = runCodeController;