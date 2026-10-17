const Conversation = require('../Models/Conversation');
const ConverMem = require('../Models/ConversationMembers');

const chatErr = require('../Errors/Chat');

const notification = require('../Socket/Notification');

const MAX_PER_CHAT = 300;

async function createNewChat(userId , username , conversation_name , converstation_type){
    const isMem = await ConverMem.findOne({
        where : {
            userId : userId , 
            conversationName : conversation_name
        }
    });

    if (converstation_type === 'direct') {
        return {
            status_code : chatErr.CannotChatWithSelfError.defaultStatusCode , 
            message : chatErr.CannotChatWithSelfError.defaultMessage
        }
    }

    if (isMem) return {
        status_code : chatErr.ChatAlreadyExistsError.defaultStatusCode , 
        error : chatErr.ChatAlreadyExistsError.defaultMessage
    }

    const conversation = await Conversation.create({ 
        name : conversation_name , 
        type : converstation_type
    });

    await conversation.addUser(userId , {
        through : {
            userRole : 'admin' , conversationName : conversation_name
        }
    });

    notification.SendMessage('Admin' , {
        action : 'Creating a new chat' , 
        username : username , 
        conversationName : conversation_name , 
        converstationType : converstation_type
    });

    return {
        message : 'A new chat is created sucessfully'
    };
}

async function joinChat(userId , conversationId){
    const isMem = await ConverMem.findOne({
        where : {
            userId , 
            conversationId
        }
    });

    console.log(`${isMem} - ${userId} - ${conversationId}`);

    if (isMem) {
        return {
            message : 'User đã ở trong đoạn chat'
        }
    }

    const conversation = await Conversation.findOne({
        where : {
            id : conversationId
        }
    });

    if (!conversation) {
        return {
            status_code : chatErr.InvalidChatNameError.defaultStatusCode , 
            error : chatErr.InvalidChatNameError.defaultMessage
        }
    }

    const  numberMembers = conversation.numberMembers + 1;

    if (conversation.type === 'direct' || numberMembers > MAX_PER_CHAT) {
        return {
            status_code : chatErr.ChatCreateRateLimitedError.defaultStatusCode , 
            error : chatErr.ChatCreateFailedError.defaultMessage
        }
    }

    await conversation.update({numberMembers});
    await conversation.addUser(
        userId , {
            through : {
                userRole : 'member' , conversationName : conversation.name
            }
        }
    );

    notification.SendMessage('Admin' , {
        action : 'join chat' , 
        userId : userId , 
        conversationId : conversation.id,
        conversation : conversation.name,
        currentMember : conversation.numberMembers
    });

    return {
        message : 'Chào mừng gia nhập!'
    };
}

module.exports = {
    createNewChat ,
    joinChat
}