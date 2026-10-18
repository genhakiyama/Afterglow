require('dotenv').config();

const MessageService = require('../Service/Message');
const notification = require('../Socket/Notification');

async function sendMessage(req , res) {
    const userId = req.userId;
    const { conversationId ,  type , content } = req.body;

    const sendMessage = await MessageService.sendMessage(userId , type , conversationId , content);

    if (sendMessage.error) {
        return res.status(sendMessage.status_code).json({
            success : false , 
            payload : {
                error : sendMessage.error
            }
        });
    }

    return res.status(200).json({
        success : true , 
        payload : {
            sendMessage
        }
    });
}

async function deleteMessage(req , res) {
    const user = req.userId;
    const {conversationId , userId , messageId} = req.body;

    const deleteMessage = await MessageService.deleteMessage(userId , conversationId , messageId);
    if (deleteMessage.error) {
        return res.status(deleteMessage.status_code).json({
            error : deleteMessage.error
        });
    }

    return res.status(200).json({
        payload : {
            deleteMessage
        }
    });
}

module.exports = {
    sendMessage , 
    deleteMessage
};
