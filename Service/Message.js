require('dotenv').config();
const Message = require('../Models/Message');
const User = require('../Models/User');
const Conversation = require('../Models/Conversation');
const ConverMem = require('../Models/ConversationMembers');

const messageErr = require('../Errors/Message');
const chatErr = require('../Errors/Chat');

async function isMember(userId , conversationId){
    const member = await ConverMem.findOne({ 
        where : {userId : senderId , conversationId}
    });
    if (!member) {
        return {
            status_code : chatErr.UserActionRestrictedError.defaultStatusCode , 
            error : chatErr.UserActionRestrictedError.defaultMessage
        }
    }
    return member;
}

async function sendMessage(senderId , type , conversationId , content) {
    const member = await isMember(senderId , conversationId);
    if (member.error) return member;

    const message = await Message.create({
        type , status : 'sent' , content ,
        userId : senderId , 
        conversationId
    });

    return {
        message : 'Tin nhắn đã gửi',
        messageId : message.id
    };
}

async function deleteMessage(senderId , conversationId , messageId) {
    const member = await isMember(senderId , conversationId);
    if (member.error) return member;
    
    await Message.destroy({
        where : {id : messageId}
    });

    return {
        message : 'Tin nhắn đã được xoá'
    };
}

module.exports = {
    sendMessage , 
    deleteMessage
}