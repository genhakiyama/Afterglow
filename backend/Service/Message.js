require('dotenv').config();
const Message = require('../Models/Message');
const User = require('../Models/User');
const Conversation = require('../Models/Conversation');
const ConverMem = require('../Models/ConversationMembers');

const messageErr = require('../Errors/Message');
const chatErr = require('../Errors/Chat');

const room = require('../Socket/RoomManager');

async function isMember(userId , conversationId){
    conversationId = Number(conversationId);
    const member = await ConverMem.findOne({ 
        where : {userId , conversationId}
    });
    if (!member) {
        return {
            status_code : chatErr.UserActionRestrictedError.defaultStatusCode , 
            error : chatErr.UserActionRestrictedError.defaultMessage
        }
    }
    return member;
}

async function getMessages(userId , conversationId) {
    const member = await isMember(userId, conversationId);
    if (member.error) return member;

    const messages = await Message.findAll({
        where : { conversationId : conversationId } ,
        include : [{ model : User , attributes : ['id' , 'username'] }] ,
        order : [['createdAt' , 'ASC']] ,
        limit : 200
    });

    return {
        messages : messages.map(msg => ({
            id : msg.id ,
            type : msg.type ,
            status : msg.status ,
            content : msg.content ,
            senderId : msg.userId ,
            senderName : msg.User ? msg.User.username : 'unknown' ,
            createdAt : msg.createdAt
        }))
    };
}

async function sendMessage(senderId , username , type , conversationId , content) {
    const member = await isMember(senderId, conversationId);
    if (member.error) return member;

    const message = await Message.create({
        type , status : 'sent' , content ,
        userId : senderId ,
        conversationId : conversationId
    });

    room.sendToRoom(conversationId , {
        from : username , 
        message : content ,
        chatId : conversationId
    });

    return {
        message : 'Tin nhắn đã gửi',
        messageId : message.id
    };
}

async function deleteMessage(senderId , username , conversationId , messageId) {
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
    deleteMessage ,
    getMessages
}