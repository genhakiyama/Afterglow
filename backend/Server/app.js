    const express = require('express');
const app = express();
const sequelize = require('../UTIL/Database');  

const cors = require('cors');
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));
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

    User.hasMany(Message , {foreignKey : 'userId'});
    Message.belongsTo(User , {foreignKey : 'userId'});

    Conversation.hasMany(Message , {foreignKey : 'conversationId'});
    Message.belongsTo(Conversation , {foreignKey : 'conversationId'});

app.use(express.json());

sequelize.sync({force : false});

app.use('/auth' , AuthenHandler);
app.use('/chat' , isAuth , ChatHandler);

module.exports = app;