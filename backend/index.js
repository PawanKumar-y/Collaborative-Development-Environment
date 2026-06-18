const express = require('express')
require('dotenv').config()
const cors = require('cors')
const http = require('http')
const connectDB = require('./dbconfig')
const LogInSignUpRoutes = require('./Routes/LogInSignUpRoutes')
const RoomRoutes = require('./Routes/RoomRoutes')
const { Server } = require('socket.io')
const SocketHandler = require('./Socket/SocketHandler.js')
const setupYjsSocketHandlers=require('./Socket/YjsSocketHandler.js')

const app = express()
app.use(cors())
app.use(express.json())

connectDB()

app.use('/api/auth', LogInSignUpRoutes)
app.use('/api/rooms', RoomRoutes)

const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
})
setupYjsSocketHandlers(io)
SocketHandler(io)
server.listen(process.env.PORT || 5000, () => (console.log('Server is running on port 5000')))