require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const commandInterpreter = require('./handlers/commandInterpreter');
const userStateHandler = require('./handlers/userStateHandler');
const { default: mongoose } = require('mongoose');
const callBackQueryHandler = require('./handlers/callBackQueryHandler');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { default: Web3 } = require('web3');
const FlowHackathonNFT = require("../../artifacts/contracts/FlowHackathonNFT.sol/FlowHackathonNFT.json");
const { pushFiles } = require('./utils/githubActions');
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

async function subscribeToEvents() {
    const web3 = new Web3(process.env.FLOW_WSS_URL);
	// create a new contract object, providing the ABI and address
	const contract = new web3.eth.Contract(FlowHackathonNFT.abi, process.env.FLOW_HACKATHON_NFT_ADDRESS);

	// subscribe to the smart contract event
    const subscriptionMintPriceUpdated = contract.events.MintPriceUpdated();
    const subscriptionMintingStatusUpdated = contract.events.MintingStatusUpdated();
    const subscriptionNftCreated = contract.events.NftCreated();
    const subscriptionTokenMinted = contract.events.TokenMinted();
    const subscriptionNftBought = contract.events.NftBought();
    const subscriptionNftListed = contract.events.NftListed();
    const subscriptionNftDelisted = contract.events.NftDelisted();
    // console.log(subscription);
	// new value every time the event is emitted
    subscriptionMintPriceUpdated.on('data', (data) => {
        console.log(data.event, data.returnValues);
    });
    subscriptionMintingStatusUpdated.on('data', (data) => {
        console.log(data.event, data.returnValues);
    });
    subscriptionNftCreated.on('data', (data) => {
        console.log(data.event, data.returnValues);
    });
    subscriptionTokenMinted.on('data', (data) => {
        console.log(data.event, data.returnValues);
    });
    subscriptionNftBought.on('data', (data) => {
        console.log(data.event, data.returnValues);
    });
    subscriptionNftListed.on('data', (data) => {
        console.log(data.event, data.returnValues);
    });
    subscriptionNftDelisted.on('data', (data) => {
        console.log(data.event, data.returnValues);
    });
}

subscribeToEvents();