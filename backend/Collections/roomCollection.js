const mongoose = require('mongoose')

const roomSchema = new mongoose.Schema({
    room_id: { type: String, required: true, unique: true },
    room_name: { type: String, required: true },
    creator_id: { type: String, required: true },
    password: { type: String, default: '' },
    collaborators: [
        {
            user_id: { type: String, required: true },
            lastEditedAt: { type: Date, default: Date.now }
        }
    ],
    content: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    lastModifiedAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Room', roomSchema)
// const mongoose = require('mongoose')

// const roomSchema = new mongoose.Schema({
//     room_id: {
//         type: String,
//         required: true,
//         unique: true
//     },
//     room_name: {
//         type: String,
//         required: true
//     },
//     creator_id: {
//         type: String,
//         required: true
//     },
//     password: {
//         type: String,
//         default: ''
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now
//     }
// })

// module.exports = mongoose.model('Room', roomSchema)