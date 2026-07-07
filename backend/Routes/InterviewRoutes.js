const express =require('express')
const route=express.Router()
const verifyJWT = require('../middleware/vertifyJWT')

const getInterviewRoomController=require('../Controllers/getInterviewRoomController')
const sendInterviewRoomListController=require('../Controllers/sendInterviewRoomListController')
const createInterviewRoomController=require('../Controllers/createInterviewRoomController')
const runCodeController=require('../Controllers/runCodeController')
const checkRoomResults=require('../Controllers/checkRoomResultsController')
const adminRoomResultsController=require('../Controllers/adminRoomResultsController')

route.get('/details/:roomId',verifyJWT,getInterviewRoomController)
route.get('/mine',verifyJWT,sendInterviewRoomListController)
route.post('/create',verifyJWT,createInterviewRoomController)
route.post('/run/:roomId',verifyJWT,runCodeController)
route.get('/getDetails/:roomId',verifyJWT,checkRoomResults)
route.get('/getAllResults/:roomId',verifyJWT,adminRoomResultsController)

module.exports=route