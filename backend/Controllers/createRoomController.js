const bcrypt = require('bcrypt')
const { v4: uuidv4 } = require('uuid')
const Room = require('../Collections/roomCollection')

const createRoomController = async (req, res) => {
    try {
        const { room_name, password } = req.body
        const creator_id = req?.user.email

        if (!room_name) {
            return res.status(400).json({ msg: "Room name cannot be empty" })
        }

        if (!creator_id) {
            return res.status(401).json({ msg: "Unauthorized access." })
        }

        const found = await Room.findOne({ room_name: room_name, creator_id: creator_id })
        if (found) {
            return res.status(400).json({ msg: "A room already exists with given name." })
        }

        const room_id = uuidv4()
        const roomData = {
            room_id,
            room_name,
            creator_id,
            collaborators: [
                {
                    user_id: creator_id,
                    lastEditedAt: new Date()
                }
            ]
        }

        if (password) {
            const salt = await bcrypt.genSalt(10)
            roomData.password = await bcrypt.hash(password, salt)
        }

        const nroom = new Room(roomData)
        await nroom.save()

        return res.status(201).json({
            msg: 'Room created successfully',
            room_id,
            room_name,
            creator_id
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            msg: 'Internal Server Error'
        })
    }
}

module.exports = createRoomController