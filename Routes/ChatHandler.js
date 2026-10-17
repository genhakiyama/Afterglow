const ChatController = require('../Controller/Conversation');
const express =require('express');

const router = express.Router();

router.post('/conversation/create' , ChatController.createChat);
router.post('/conversation/join/:conversationId' , ChatController.joinChat);

module.exports = router;