const { safeCreateUser, getNFTDetails, getLatestMintedNFTs } = require("../utils/databaseActions");
const { getJsonFromTokenId, getImageFromTokenId, generateGrid } = require("../utils/utils");
const moment = require("moment");
const callBackQueryHandler = async (query, bot, userState) => {
    let user;
    try {
        user = await safeCreateUser(
            query.from.id,
            query.from.username
                ? query.from.username
                : query.from.first_name
                    ? query.from.first_name + " " + query.from.last_name
                    : query.from.id
        );
    } catch (error) {
        console.error("Error creating user:", error);
    }

    if (query.data.startsWith("exportWallet:")) {
        const walletAddress = query.data.split(":")[1];
        userState[query.message.chat.id] = {
            state: "exportWallet",
            walletAddress,
        };
        await bot.sendMessage(
            query.message.chat.id,
            "Psst! Time for the magic words! Whisper your password like you're sharing a crypto conspiracy! 🤫"
        );
        await bot.answerCallbackQuery(query.id, {
            text: "Psst! Time for the magic words! Whisper your password like you're sharing a crypto conspiracy! 🤫",
        });
        return;
    } else if (query.data.startsWith("deleteWallet:")) {
        const walletAddress = query.data.split(":")[1];
        userState[query.message.chat.id] = {
            state: "deleteWallet",
            walletAddress,
        };
        await bot.sendMessage(
            query.message.chat.id,
            "Time to do the secret handshake! What's your password? 🤝"
        );
        await bot.answerCallbackQuery(query.id, {
            text: "Time to do the secret handshake! What's your password? 🤝",
        });
        return;
    } else if (query.data.startsWith("enableMinting:")) {
        const walletAddress = query.data.split(":")[1];
        userState[query.message.chat.id] = {
            state: "enableMinting",
            walletAddress,
            step: 1,
        };
        await bot.sendMessage(
            query.message.chat.id,
            "Knock knock! Password required! (No blockchain peeking allowed!) 🚪"
        );
        await bot.answerCallbackQuery(query.id, {
            text: "Knock knock! Password required! (No blockchain peeking allowed!) 🚪",
        });
        return;
    } else if (query.data.startsWith("disableMinting:")) {
        const walletAddress = query.data.split(":")[1];
        userState[query.message.chat.id] = {
            state: "disableMinting",
            walletAddress,
            step: 1,
        };
        await bot.sendMessage(
            query.message.chat.id,
            "Password time! Pretend you're a secret agent avoiding blockchain surveillance! 🕶️"
        );
        await bot.answerCallbackQuery(query.id, {
            text: "Password time! Pretend you're a secret agent avoiding blockchain surveillance! 🕶️",
        });
        return;
    } else if (query.data.startsWith("setMintPrice:")) {
        const walletAddress = query.data.split(":")[1];
        userState[query.message.chat.id] = {
            state: "setMintPrice",
            walletAddress,
            step: 1,
        };
        await bot.sendMessage(
            query.message.chat.id,
            "How much ETH should minting each NFT cost? 💎"
        );
        await bot.answerCallbackQuery(query.id, {
            text: "How much ETH should minting each NFT cost? 💎",
        });
        return;
    } else if (query.data.startsWith("ownerMint:")) {
        const walletAddress = query.data.split(":")[1];
        userState[query.message.chat.id] = {
            state: "ownerMint",
            walletAddress,
            step: 1,
        };
        await bot.sendMessage(
            query.message.chat.id,
            "Quick! Enter your super secret password while doing a ninja roll! 🥷"
        );
        await bot.answerCallbackQuery(query.id, {
            text: "Quick! Enter your super secret password while doing a ninja roll! 🥷",
        });
        return;
    } else if (query.data.startsWith("mint:")) {
        const walletAddress = query.data.split(":")[1];
        userState[query.message.chat.id] = {
            state: "mint",
            walletAddress,
            step: 1,
        };
        await bot.sendMessage(
            query.message.chat.id,
            "Password required! Whisper it like you're sharing the recipe for a secret sauce! 🤌"
        );
        await bot.answerCallbackQuery(query.id, {
            text: "Password required! Whisper it like you're sharing the recipe for a secret sauce! 🤌",
        });
        return;
    } else if (query.data.startsWith("viewNFT:")) {
        const tokenId = query.data.split(":")[1];
        userState[query.message.chat.id] = {
            state: "viewNFT",
            tokenId,
            step: 1,
        };
        let nftDetails = await getNFTDetails(tokenId);
        let nftMetadata = JSON.parse(nftDetails.metadata);
        let nftImage = await getImageFromTokenId(tokenId);
        await bot.sendPhoto(query.message.chat.id, nftImage, {
            caption: `✨ Behold this masterpiece! ✨\nName: ${nftMetadata.name}\nDescription: ${nftMetadata.description
                }\n${nftDetails.purchaseEnabled
                    ? `Price: ${nftDetails.purchasePrice} ETH 💰`
                    : "Not for sale (this one's playing hard to get! 😏)"
                }`,
        });
        await bot.answerCallbackQuery(query.id);
        return;
    } else if (query.data.startsWith("allowBuy:")) {
        const nftId = query.data.split(":")[1];
        userState[query.message.chat.id] = {
            state: "allowBuy",
            nftId,
            step: 1,
        };
        await bot.sendMessage(
            query.message.chat.id,
            "Time for the password dance! Do the crypto shuffle while typing! 💃"
        );
        await bot.answerCallbackQuery(query.id, {
            text: "Time for the password dance! Do the crypto shuffle while typing! 💃",
        });
        return;
    } else if (query.data.startsWith("disallowBuy:")) {
        const nftId = query.data.split(":")[1];
        userState[query.message.chat.id] = {
            state: "disallowBuy",
            nftId,
            step: 1,
        };
        await bot.sendMessage(
            query.message.chat.id,
            "Password time! Type it like you're defusing a crypto bomb! ⏰"
        );
        await bot.answerCallbackQuery(query.id, {
            text: "Password time! Type it like you're defusing a crypto bomb! ⏰",
        });
        return;
    } else if (query.data.startsWith("buy:")) {
        const walletAddress = query.data.split(":")[1];
        userState[query.message.chat.id] = {
            state: "buy",
            walletAddress,
            step: 1,
        };
        await bot.sendMessage(
            query.message.chat.id,
            "Enter your password like you're unlocking a digital treasure chest! 🗝️"
        );
        await bot.answerCallbackQuery(query.id, {
            text: "Enter your password like you're unlocking a digital treasure chest! 🗝️",
        });
        return;
    } else if (query.data.startsWith("listNFTs:")) {
        const page = query.data.split(":")[1];
        let latestMintedNFTs = await getLatestMintedNFTs(page, 5);
        let nftData = latestMintedNFTs.map((nft) => {
            let grid = generateGrid(nft.tokenId);
            return {
                type: 'photo',
                media: grid,
                caption: `🎨 NFT Showcase 🎨\nToken ID: ${nft.tokenId}\nName: ${JSON.parse(nft.metadata).name}\nOwner: ${nft.owner}\nBorn on: ${moment(nft.createdAt).format('DD/MM/YYYY HH:mm:ss')} 👶\n\n${JSON.parse(nft.metadata).description} \n\n${nft.purchaseEnabled ? '💰 Price: ' + nft.price + ' ETH' : '🔒 Not for Sale'}`
            }
        });
        if (nftData.length > 0) {
            await bot.sendMediaGroup(query.message.chat.id, nftData);
        } else {
            await bot.sendMessage(query.message.chat.id, 'Looks like we hit rock bottom! No more NFTs to show! 🏜️');
        }
        if (latestMintedNFTs.length === 1) {
            await bot.sendMessage(query.message.chat.id, 'Fresh out of the oven! Want to see more? Hit that Load More button! 🍪', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Load More NFTs 🎭', callback_data: `listNFTs:${1 + Number(page)}` }],
                    ]
                }
            });
        }
        return;
    }

    switch (query.data) {
        case "createWallet":
            if (user.walletsAssociated.length >= 5) {
                await bot.sendMessage(
                    query.message.chat.id,
                    "You already have 5 wallets associated with your account. Please delete some wallets before creating a new one."
                );
                break;
            }
            userState[query.message.chat.id] = { state: "createWallet" };
            await bot.sendMessage(
                query.message.chat.id,
                user.password
                    ? "You already have a password set for your account. Please use it to create a wallet."
                    : "Please send a password"
            );
            break;
        case "importWallet":
            if (user.walletsAssociated.length >= 5) {
                await bot.sendMessage(
                    query.message.chat.id,
                    "You already have 5 wallets associated with your account. Please delete some wallets before importing a new one."
                );
                break;
            }
            userState[query.message.chat.id] = {
                state: "importWallet",
                step: 1,
            };
            await bot.sendMessage(
                query.message.chat.id,
                user.password
                    ? "You already have a password set for your account. Please use it to import a wallet."
                    : "Please send a password"
            );
            break;
        case "getWallets":
            let associatedWallets = user.walletsAssociated;
            if (associatedWallets.length === 0) {
                await bot.sendMessage(
                    query.message.chat.id,
                    "You have no wallets associated with your account"
                );
            } else {
                await bot.sendMessage(
                    query.message.chat.id,
                    "Your wallet addresses are: \n" +
                    associatedWallets
                        .map(
                            (wallet, index) =>
                                `${index + 1}. \`${wallet.address}\``
                        )
                        .join("\n"),
                    { parse_mode: "Markdown" }
                );
            }
            break;
        case "exportWallet":
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(
                    query.message.chat.id,
                    "You have no wallets associated with your account"
                );
                break;
            }
            await bot.sendMessage(
                query.message.chat.id,
                "Please send a wallet address",
                {
                    reply_markup: {
                        inline_keyboard: user.walletsAssociated.map(
                            (wallet, index) => [
                                {
                                    text: `${index + 1}. ${wallet.address.slice(
                                        0,
                                        6
                                    )}...${wallet.address.slice(-4)}`,
                                    callback_data: `exportWallet:${wallet.address}`,
                                },
                            ]
                        ),
                    },
                }
            );
            break;
        case "deleteWallet":
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(
                    query.message.chat.id,
                    "You have no wallets associated with your account"
                );
                break;
            }
            await bot.sendMessage(
                query.message.chat.id,
                "Please send a wallet address",
                {
                    reply_markup: {
                        inline_keyboard: user.walletsAssociated.map(
                            (wallet, index) => [
                                {
                                    text: `${index + 1}. ${wallet.address.slice(
                                        0,
                                        6
                                    )}...${wallet.address.slice(-4)}`,
                                    callback_data: `deleteWallet:${wallet.address}`,
                                },
                            ]
                        ),
                    },
                }
            );
            break;
        case "help":
            await bot.sendMessage(
                query.message.chat.id,
                "Here are the commands:\n /start\n /getpubkey\n /help",
                {
                    reply_markup: {
                        keyboard: [
                            [{ text: "/start" }],
                            [{ text: "/getPubKey" }],
                            [{ text: "/help" }],
                        ],
                        one_time_keyboard: true,
                        resize_keyboard: true,
                    },
                }
            );
            break;
        default:
            await bot.sendMessage(query.message.chat.id, "Unknown command");
            break;
    }
    await bot.answerCallbackQuery(query.id);
};
module.exports = callBackQueryHandler;
