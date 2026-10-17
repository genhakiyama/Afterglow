require('dotenv').config();
const http = require('http');
const app = require('./Server/app');

const server = http.createServer(app);

const io = require('./socketIo').init(server);

server.listen(3000 , () => {
    console.log('My server is running');
})