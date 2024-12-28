require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const commandInterpreter = require('./handlers/commandInterpreter');
const userStateHandler = require('./handlers/userStateHandler');
const { default: mongoose } = require('mongoose');
const callBackQueryHandler = require('./handlers/callBackQueryHandler');

const bot = new TelegramBot(process.env.BOT_AUTH_TOKEN, { polling: true });

const userState = {};

async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to database');
    } catch (error) {
        console.error('Error connecting to database:', error);
    }
}

connectToDatabase();
bot.on('message', (msg) => {
    console.log(msg);
    if(msg.text && msg.entities && msg.entities[0].type === 'bot_command') {
        commandInterpreter(msg, bot, userState);
    } else {
        if(userState[msg.chat.id] !== undefined && userState[msg.chat.id].state !== 'idle') {
            userStateHandler(msg, bot, userState);
        } else {
            bot.sendMessage(msg.chat.id, 'Please send a command');
        }
    }
});

bot.on('callback_query', (query) => {
    console.log(query);
    callBackQueryHandler(query, bot, userState);
});