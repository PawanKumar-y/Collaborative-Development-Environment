const mongoose =require('mongoose');

const testcaseSchema= new mongoose.Schema({
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isSample: {type:Boolean,default:false}
})

const questionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    testCases: [testcaseSchema]
})

const interviewRoomSchema= new mongoose.Schema({
    room_name: { type: String, required: true },
    creator_id: { type: String, required: true },
    duration_minutes: { type: Number, required: true },
    questions: [questionSchema],
    participants: [{ type: String, default: [] }] ,
    createdAt: { type: Date, default: Date.now },
    willFinishAt: { type: Date, required: true },
})

module.exports = mongoose.model('InterviewRoom', interviewRoomSchema);