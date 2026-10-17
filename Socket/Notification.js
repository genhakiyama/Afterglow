const io = require('../socketIo');

async function SendMessage(event , content){
    io.getIO().emit(event , content);
}

module.exports = {
    SendMessage
}