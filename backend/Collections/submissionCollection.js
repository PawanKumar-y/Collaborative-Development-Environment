// models/Submission.js
import mongoose from 'mongoose'

const submissionSchema = new mongoose.Schema({
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewRoom', required: true },
    question_id: { type: mongoose.Schema.Types.ObjectId, required: true },  // sub-doc id within questions[]
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    code: { type: String, required: true },
    language: { type: String, required: true },
    passed_count: { type: Number, required: true },
    total_count: { type: Number, required: true },
    submitted_at: { type: Date, default: Date.now },
    errors: { type: String, default: '' }
})

export default mongoose.model('Submission', submissionSchema)