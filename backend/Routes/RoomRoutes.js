const express = require('express')
const createRoomController = require('../Controllers/createRoomController')
const verifyJWT = require('../middleware/vertifyJWT')
const sendRoomListController=require('../Controllers/sendRoomListController')
const roomDetailsController=require('../Controllers/roomDetailsController')
const joinRoomController=require('../Controllers/joinRoomController')


const route = express.Router()

route.post('/create', verifyJWT, createRoomController)
route.get('/mine',verifyJWT,sendRoomListController)
route.get('/particular/:roomId',verifyJWT,roomDetailsController)
route.post('/joinroom/:roomId',verifyJWT,joinRoomController)
module.exports = route