require('dotenv').config();
const Message = require('../Models/Message');
const User = require('../Models/User');
const Conversation = require('../Models/Conversation');
const ConverMem = require('../Models/ConversationMembers');

const messageErr = require('../Errors/Message');
const chatErr = require('../Errors/Chat');

const notification = require('../Socket/Notification');

async function sendMessage(senderId , type , conversationId , content) {
    const member = await ConverMem.findOne({ 
        where : {userId : senderId , conversationId}
    });

    if (!member) {
        return {
            status_code : chatErr.UserActionRestrictedError.defaultStatusCode , 
            error : chatErr.UserActionRestrictedError.defaultMessage
        }
    }

    await Message.create({
        type , status : 'sent' , content ,
        userId : senderId , 
        conversationId
    });

    return {
        message : 'Tin nhắn đang gửi'
    };
}

module.exports = {
    sendMessage
}