const { getUser, attachWalletToUser } = require("../utils/databaseActions");
const { getPubKeyFromPrivateKey, checkForStrongPassword, createNewWallet, hashPassword, decryptPrivateKeyWithAddress } = require("../utils/utils");

const createWallet = async (message, bot) => {
    try {
        const user = await getUser(message.from.id);
        let password = message.text;
        if (user.password) {
            // see if hashes match
            if (hashPassword(password) !== user.password) {
                bot.sendMessage(message.chat.id, 'Password does not match. Try again.');
                return;
            }
        }
        if (!checkForStrongPassword(password)) {
            bot.sendMessage(message.chat.id, 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number');
            return;
        }
        const wallet = await createNewWallet();
        await attachWalletToUser(user, wallet, password);
        await bot.sendMessage(message.chat.id, `
            Wallet created successfully ✅
            Your wallet address is: \`${wallet.address}\`
            Your private key for this wallet is: \`${wallet.privateKey}\`
            Please save it in a secure location
            `.split('\n') // Split by line breaks
            .map(line => line.trimStart()) // Remove leading spaces from each line
            .join('\n') // Rejoin the lines
            , { parse_mode: 'MarkdownV2' }
        );
    } catch (error) {
        console.error('Error creating wallet:', error);
        bot.sendMessage(message.chat.id, 'Error creating wallet');
    }
}

const exportWallet = async (message, bot) => {
    const user = await getUser(message.from.id);
    const wallet = user.walletsAssociated.find(wallet => wallet.address === userState[message.chat.id].walletAddress);
    if (!wallet) {
        bot.sendMessage(message.chat.id, 'Wallet not found');
        return;
    }
    let password = message.text;
    if (user.password) {
        if (hashPassword(password) !== user.password) {
            bot.sendMessage(message.chat.id, 'Password does not match. Try again.');
            return;
        }
    }
    const privateKey = decryptPrivateKeyWithAddress(wallet.privateKeyEncrypted, password, wallet.address);
    bot.sendMessage(message.chat.id, `Your wallet address is: \`${wallet.address}\`\nYour private key for this wallet is: \`${privateKey}\``, { parse_mode: 'MarkdownV2' });
}

module.exports = {
    createWallet,
    exportWallet
}