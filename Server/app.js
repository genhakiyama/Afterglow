    const express = require('express');
const app = express();
const sequelize = require('../UTIL/Database');  

//---- ROUTES 
    const AuthenHandler = require('../Routes/AuthHandler');
    const isAuth = require('../Middleware/is-auth');
    const ChatHandler = require('../Routes/ChatHandler');

//--- DATABASE  
    const User = require('../Models/User');
    const Conversation = require('../Models/Conversation');
    const ConversationMem = require('../Models/ConversationMembers');
    const Message = require('../Models/Message');

    User.belongsToMany(Conversation , {
        through : ConversationMem , 
        foreginKey : 'userId' 
    });
    Conversation.belongsToMany(User , {
        through : ConversationMem , 
        foreignKey : 'conversationId'
    });

    User.hasMany(Message , {foreignKey : 'conversationId'});
    Message.belongsTo(Conversation , {foreignKey : 'conversationId'});
    User.hasMany(Message , {foreginKey : 'senderId'});
    Message.belongsTo(User , {foreginKey : 'senderId'});

app.use(express.json());

sequelize.sync({force : false});

app.use('/auth' , AuthenHandler);
app.use('/chat' , isAuth , ChatHandler);

module.exports = app;