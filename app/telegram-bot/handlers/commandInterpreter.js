const { safeCreateUser } = require("../utils/databaseActions");

const commandInterpreter = async (message, bot, userState) => {
    let user;
    try {
        user = await safeCreateUser(message.from.id, message.from.username ? message.from.username : message.from.first_name ? message.from.first_name + ' ' + message.from.last_name : message.from.id);
    } catch (error) {
        console.error('Error creating user:', error);
    }
    switch (message.text) {
        case '/start':
            await bot.sendMessage(message.chat.id, 'Welcome to the Flow Asia Hackathon NFT Marketplace. You can create a wallet or import an existing wallet. You can also get your public key.');
            await bot.sendMessage(message.chat.id, 'Please select an option', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Create Wallet', callback_data: 'createWallet' }],
                        [{ text: 'Import Wallet', callback_data: 'importWallet' }],
                        [{ text: 'Get Wallets', callback_data: 'getWallets' }],
                        [{ text: 'Export Wallet', callback_data: 'exportWallet' }],
                        [{ text: 'Delete Wallet', callback_data: 'deleteWallet' }],
                        [{ text: 'Help', callback_data: 'help' }]
                    ]
                }
            });
            break;
        case '/createwallet':
            if (user.walletsAssociated.length >= 5) {
                await bot.sendMessage(message.chat.id, 'You already have 5 wallets associated with your account. Please delete some wallets before creating a new one.');
                break;
            }
            userState[message.chat.id] = { state: 'createWallet' };
            await bot.sendMessage(message.chat.id, user.password ? 'You already have a password set for your account. Please use it to create a wallet.' : 'Please send a password');
            break;
        case '/importwallet':
            if (user.walletsAssociated.length >= 5) {
                await bot.sendMessage(message.chat.id, 'You already have 5 wallets associated with your account. Please delete some wallets before importing a new one.');
                break;
            }
            userState[message.chat.id] = { state: 'importWallet', step: 1 };
            await bot.sendMessage(message.chat.id, user.password ? 'You already have a password set for your account. Please use it to import a wallet.' : 'Please send a password');
            break;
        case '/getwallets':
            let associatedWallets = user.walletsAssociated;
            if (associatedWallets.length === 0) {
                await bot.sendMessage(message.chat.id, 'You have no wallets associated with your account');
            } else {
                await bot.sendMessage(message.chat.id, 'Your wallet addresses are: \n' + associatedWallets.map((wallet, index) => `${index + 1}. \`${wallet.address}\``).join('\n'), { parse_mode: 'Markdown' });
            }
            break;
        case '/exportwallet':
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'You have no wallets associated with your account');
                break;
            }
            await bot.sendMessage(message.chat.id, 'Please send a wallet address', {
                reply_markup: {
                    inline_keyboard: user.walletsAssociated.map((wallet, index) => [
                        { text: `${index + 1}. ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`, callback_data: `exportWallet:${wallet.address}` }
                    ])
                }
            });
            break;
        case '/deletewallet':
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'You have no wallets associated with your account');
                break;
            }
            await bot.sendMessage(message.chat.id, 'Please send a wallet address', {
                reply_markup: {
                    inline_keyboard: user.walletsAssociated.map((wallet, index) => [
                        { text: `${index + 1}. ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`, callback_data: `deleteWallet:${wallet.address}` }
                    ])
                }
            });
            break;
        case '/help':
            await bot.sendMessage(message.chat.id, 'Here are the commands:\n /start\n /getpubkey\n /help', {
                reply_markup: {
                    keyboard: [
                        [{ text: '/start' }],
                        [{ text: '/getPubKey' }],
                        [{ text: '/help' }]
                    ],
                    one_time_keyboard: true,
                    resize_keyboard: true
                }
            });
            break;
        default:
            await bot.sendMessage(message.chat.id, 'Unknown command');
            break;
    }
}

module.exports = commandInterpreter;