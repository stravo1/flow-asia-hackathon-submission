const { getUser, attachWalletToUser, deleteWalletFromUser } = require("../utils/databaseActions");
const { getPubKeyFromPrivateKey, checkForStrongPassword, createNewWallet, hashPassword, decryptPrivateKeyWithAddress, importWallet, getJsonFromTokenId, getImageFromTokenId, generateGrid } = require("../utils/utils");

const userStateHandler = async (message, bot, userState) => {
    console.log(userState[message.chat.id]);

    switch (userState[message.chat.id]?.state) {
        case 'createWallet':
            try {
                const user = await getUser(message.from.id);
                let password = message.text;
                if (user.password) {
                    // see if hashes match
                    if (hashPassword(password) !== user.password) {
                        await bot.sendMessage(message.chat.id, 'Password does not match. Try again.');
                        return;
                    }
                }
                if (!checkForStrongPassword(password)) {
                    await bot.sendMessage(message.chat.id, 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number');
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
                await bot.sendMessage(message.chat.id, 'Error creating wallet');
            }
            userState[message.chat.id] = { state: 'idle' };
            break;

        case 'exportWallet':
            try {
                const user = await getUser(message.from.id);
                const wallet = user.walletsAssociated.find(wallet => wallet.address === userState[message.chat.id].walletAddress);
                if (!wallet) {
                    await bot.sendMessage(message.chat.id, 'Wallet not found');
                    return;
                }
                let password = message.text;
                if (user.password) {
                    if (hashPassword(password) !== user.password) {
                        await bot.sendMessage(message.chat.id, 'Password does not match. Try again.');
                        return;
                    }
                }
                const privateKey = decryptPrivateKeyWithAddress(wallet.privateKeyEncrypted, password, wallet.address);
                await bot.sendMessage(message.chat.id, `Your wallet address is: \`${wallet.address}\`\nYour private key for this wallet is: \`${privateKey}\``, { parse_mode: 'MarkdownV2' });
            } catch (error) {
                console.error('Error exporting wallet:', error);
                await bot.sendMessage(message.chat.id, 'Error exporting wallet');
            }
            userState[message.chat.id] = { state: 'idle' };
            break;

        case 'deleteWallet':
            try {
                const deleteUser = await getUser(message.from.id);
                const deleteWallet = deleteUser.walletsAssociated.find(wallet => wallet.address === userState[message.chat.id].walletAddress);
                await deleteWalletFromUser(deleteUser, deleteWallet.address);
                await bot.sendMessage(message.chat.id, 'Wallet deleted successfully');
            } catch (error) {
                console.error('Error deleting wallet:', error);
                await bot.sendMessage(message.chat.id, 'Error deleting wallet');
            }
            userState[message.chat.id] = { state: 'idle' };
            break;

        case 'importWallet':
            try {
                if (userState[message.chat.id].step === 1) {
                    const user = await getUser(message.from.id);
                    let password = message.text;
                    if (user.password) {
                        // see if hashes match
                        if (hashPassword(password) !== user.password) {
                            await bot.sendMessage(message.chat.id, 'Password does not match. Try again.');
                            return;
                        }
                    }
                    if (!checkForStrongPassword(password)) {
                        await bot.sendMessage(message.chat.id, 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number');
                        return;
                    }
                    userState[message.chat.id].step = 2;
                    userState[message.chat.id].password = password;
                    await bot.sendMessage(message.chat.id, 'Please send a private key');
                } else if (userState[message.chat.id].step === 2) {
                    const user = await getUser(message.from.id);
                    const importedWallet = await importWallet(message.text);
                    await attachWalletToUser(user, importedWallet, userState[message.chat.id].password);
                    await bot.sendMessage(message.chat.id, 'Wallet imported successfully');
                    userState[message.chat.id] = { state: 'idle' };
                }
                break;
            } catch (error) {
                console.error('Error importing wallet:', error);
                await bot.sendMessage(message.chat.id, 'Error importing wallet');
            }
            userState[message.chat.id] = { state: 'idle' };
            break;

        case 'getNFT':
            try {
                const nftDetails = await getJsonFromTokenId(message.text);
                if(nftDetails == null) {
                    await bot.sendMessage(message.chat.id, 'NFT not found');
                    userState[message.chat.id] = { state: 'idle' };
                    return;
                }
                const loadingMessage = await bot.sendMessage(message.chat.id, 'Loading NFT...');
                getImageFromTokenId(message.text).then(
                    (image) => {
                        bot.deleteMessage(message.chat.id, loadingMessage.message_id);
                        bot.sendPhoto(message.chat.id, image, {
                            caption: `Name: ${nftDetails.name}\nDescription: ${nftDetails.description}`
                        });
                    }
                ).catch(
                    (error) => {
                        bot.deleteMessage(message.chat.id, loadingMessage.message_id);
                        bot.sendMessage(message.chat.id, 'Error getting NFT. Are you sure the token ID is correct?');
                    }
                );
            } catch (error) {
                console.error('Error getting NFT:', error);
                await bot.sendMessage(message.chat.id, 'Error getting NFT');
            }
            userState[message.chat.id] = { state: 'idle' };
            break;

        case 'getGrid':
            const grid = generateGrid(message.text);
            await bot.sendPhoto(message.chat.id, grid);
            // userState[message.chat.id] = { state: 'idle' };
            break;

        default:
            await bot.sendMessage(message.chat.id, 'Please send correct command');
            userState[message.chat.id] = { state: 'idle' };
            break;
    }


}

module.exports = userStateHandler;
