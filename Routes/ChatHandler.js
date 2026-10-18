const ChatController = require('../Controller/Conversation');
const MessageController = require('../Controller/Message');
const express =require('express');

const router = express.Router();

router.post('/conversation/create' , ChatController.createChat);
router.post('/conversation/join/:conversationId' , ChatController.joinChat);

router.post('/message/send' , MessageController.sendMessage);
router.delete('/message/delete' , MessageController.deleteMessage);

module.exports = router;