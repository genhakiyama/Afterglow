require('dotenv').config();

const MessageService = require('../Service/Message');
const notification = require('../Socket/Notification');

async function SendMessage(req , res) {
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
            message : sendMessage.message
        }
    });
}