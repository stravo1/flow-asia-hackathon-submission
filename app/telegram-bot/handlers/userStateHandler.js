const { default: Web3 } = require("web3");
const {
    enableMinting,
    getGasEstimate,
    disableMinting,
    setMintPrice,
    getMaxSupply,
    mintByOwner,
} = require("../utils/blockchainActions");
const {
    getUser,
    attachWalletToUser,
    deleteWalletFromUser,
} = require("../utils/databaseActions");
const {
    getPubKeyFromPrivateKey,
    checkForStrongPassword,
    createNewWallet,
    hashPassword,
    decryptPrivateKeyWithAddress,
    importWallet,
    getJsonFromTokenId,
    getImageFromTokenId,
    generateGrid,
    createJSONSchemaFileForTokenId,
    createImageFileForTokenId,
} = require("../utils/utils");
const { pushFiles, localDir } = require("../utils/githubActions");

const userStateHandler = async (message, bot, userState) => {
    console.log(userState[message.chat.id]);

    switch (userState[message.chat.id]?.state) {
        case "createWallet":
            try {
                const user = await getUser(message.from.id);
                let password = message.text;
                if (user.password) {
                    // see if hashes match
                    if (hashPassword(password) !== user.password) {
                        await bot.sendMessage(
                            message.chat.id,
                            "Password does not match. Try again."
                        );
                        return;
                    }
                }
                if (!checkForStrongPassword(password)) {
                    await bot.sendMessage(
                        message.chat.id,
                        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number"
                    );
                    return;
                }
                const wallet = await createNewWallet();
                await attachWalletToUser(user, wallet, password);
                await bot.sendMessage(
                    message.chat.id,
                    `
                    Wallet created successfully ✅
                    Your wallet address is: \`${wallet.address}\`
                    Your private key for this wallet is: \`${wallet.privateKey}\`
                    Please save it in a secure location
                    `
                        .split("\n") // Split by line breaks
                        .map((line) => line.trimStart()) // Remove leading spaces from each line
                        .join("\n"), // Rejoin the lines
                    { parse_mode: "MarkdownV2" }
                );
            } catch (error) {
                console.error("Error creating wallet:", error);
                await bot.sendMessage(message.chat.id, "Error creating wallet");
            }
            userState[message.chat.id] = { state: "idle" };
            break;

        case "exportWallet":
            try {
                const user = await getUser(message.from.id);
                const wallet = user.walletsAssociated.find(
                    (wallet) =>
                        wallet.address ===
                        userState[message.chat.id].walletAddress
                );
                if (!wallet) {
                    await bot.sendMessage(message.chat.id, "Wallet not found");
                    return;
                }
                let password = message.text;
                if (user.password) {
                    if (hashPassword(password) !== user.password) {
                        await bot.sendMessage(
                            message.chat.id,
                            "Password does not match. Try again."
                        );
                        return;
                    }
                }
                const privateKey = decryptPrivateKeyWithAddress(
                    wallet.privateKeyEncrypted,
                    password,
                    wallet.address
                );
                await bot.sendMessage(
                    message.chat.id,
                    `Your wallet address is: \`${wallet.address}\`\nYour private key for this wallet is: \`${privateKey}\``,
                    { parse_mode: "MarkdownV2" }
                );
            } catch (error) {
                console.error("Error exporting wallet:", error);
                await bot.sendMessage(
                    message.chat.id,
                    "Error exporting wallet"
                );
            }
            userState[message.chat.id] = { state: "idle" };
            break;

        case "deleteWallet":
            try {
                const deleteUser = await getUser(message.from.id);
                const deleteWallet = deleteUser.walletsAssociated.find(
                    (wallet) =>
                        wallet.address ===
                        userState[message.chat.id].walletAddress
                );
                await deleteWalletFromUser(deleteUser, deleteWallet.address);
                await bot.sendMessage(
                    message.chat.id,
                    "Wallet deleted successfully"
                );
            } catch (error) {
                console.error("Error deleting wallet:", error);
                await bot.sendMessage(message.chat.id, "Error deleting wallet");
            }
            userState[message.chat.id] = { state: "idle" };
            break;

        case "importWallet":
            try {
                if (userState[message.chat.id].step === 1) {
                    const user = await getUser(message.from.id);
                    let password = message.text;
                    if (user.password) {
                        // see if hashes match
                        if (hashPassword(password) !== user.password) {
                            await bot.sendMessage(
                                message.chat.id,
                                "Password does not match. Try again."
                            );
                            return;
                        }
                    }
                    if (!checkForStrongPassword(password)) {
                        await bot.sendMessage(
                            message.chat.id,
                            "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number"
                        );
                        return;
                    }
                    userState[message.chat.id].step = 2;
                    userState[message.chat.id].password = password;
                    await bot.sendMessage(
                        message.chat.id,
                        "Please send a private key"
                    );
                } else if (userState[message.chat.id].step === 2) {
                    const user = await getUser(message.from.id);
                    const importedWallet = await importWallet(message.text);
                    await attachWalletToUser(
                        user,
                        importedWallet,
                        userState[message.chat.id].password
                    );
                    await bot.sendMessage(
                        message.chat.id,
                        "Wallet imported successfully"
                    );
                    userState[message.chat.id] = { state: "idle" };
                }
                break;
            } catch (error) {
                console.error("Error importing wallet:", error);
                await bot.sendMessage(
                    message.chat.id,
                    "Error importing wallet"
                );
            }
            userState[message.chat.id] = { state: "idle" };
            break;

        case "getNFT":
            try {
                const nftDetails = await getJsonFromTokenId(message.text);
                if (nftDetails == null) {
                    await bot.sendMessage(message.chat.id, "NFT not found");
                    userState[message.chat.id] = { state: "idle" };
                    return;
                }
                const loadingMessage = await bot.sendMessage(
                    message.chat.id,
                    "Loading NFT..."
                );
                getImageFromTokenId(message.text)
                    .then((image) => {
                        bot.deleteMessage(
                            message.chat.id,
                            loadingMessage.message_id
                        );
                        bot.sendPhoto(message.chat.id, image, {
                            caption: `Name: ${nftDetails.name}\nDescription: ${nftDetails.description}`,
                        });
                    })
                    .catch((error) => {
                        bot.deleteMessage(
                            message.chat.id,
                            loadingMessage.message_id
                        );
                        bot.sendMessage(
                            message.chat.id,
                            "Error getting NFT. Are you sure the token ID is correct?"
                        );
                    });
            } catch (error) {
                console.error("Error getting NFT:", error);
                await bot.sendMessage(message.chat.id, "Error getting NFT");
            }
            userState[message.chat.id] = { state: "idle" };
            break;

        case "getGrid":
            const grid = generateGrid(message.text);
            await bot.sendPhoto(message.chat.id, grid);
            // userState[message.chat.id] = { state: 'idle' };
            break;

        case "enableMinting":
            if (userState[message.chat.id].step === 1) {
                try {
                    const user = await getUser(message.from.id);
                    const wallet = user.walletsAssociated.find(
                        (wallet) =>
                            wallet.address ===
                            userState[message.chat.id].walletAddress
                    );
                    let password = message.text;
                    if (user.password) {
                        if (hashPassword(password) !== user.password) {
                            await bot.sendMessage(
                                message.chat.id,
                                "Password does not match. Try again."
                            );
                            return;
                        }
                    }
                    const privateKey = decryptPrivateKeyWithAddress(
                        wallet.privateKeyEncrypted,
                        password,
                        wallet.address
                    );
                    let gasEstimate = await getGasEstimate(
                        "setMintingEnabled",
                        wallet.address,
                        true
                    );
                    console.log(gasEstimate);
                    await bot.sendMessage(
                        message.chat.id,
                        `Gas price: ${gasEstimate.etherValue} ETH. Are you sure you want to continue?`,
                        {
                            reply_markup: {
                                keyboard: [[{ text: "Yes" }], [{ text: "No" }]],
                                one_time_keyboard: true,
                                resize_keyboard: true,
                            },
                        }
                    );
                    userState[message.chat.id].step = 2;
                    userState[message.chat.id].gasEstimate =
                        gasEstimate.gasEstimate;
                    userState[message.chat.id].gasPrice = gasEstimate.gasPrice;
                    userState[message.chat.id].privateKey = privateKey;
                    userState[message.chat.id].walletAddress = wallet.address;
                } catch (error) {
                    console.error("Error enabling minting:", error);
                    await bot.sendMessage(
                        message.chat.id,
                        "Error enabling minting"
                    );
                }
            } else if (userState[message.chat.id].step === 2) {
                if (message.text === "Yes") {
                    try {
                        let transactionHash = await enableMinting(
                            userState[message.chat.id].walletAddress,
                            userState[message.chat.id].privateKey,
                            userState[message.chat.id].gasEstimate,
                            userState[message.chat.id].gasPrice
                        );
                        await bot.sendMessage(
                            message.chat.id,
                            `Minting enabled successfully\nTransaction hash: ${transactionHash}`
                        );
                    } catch (error) {
                        console.error("Error enabling minting:", error);
                        await bot.sendMessage(
                            message.chat.id,
                            "Error enabling minting"
                        );
                    }
                } else {
                    await bot.sendMessage(
                        message.chat.id,
                        "Minting not enabled"
                    );
                }
                userState[message.chat.id] = { state: "idle" };
            }
            break;
        case "disableMinting":
            if (userState[message.chat.id].step === 1) {
                try {
                    const user = await getUser(message.from.id);
                    const wallet = user.walletsAssociated.find(
                        (wallet) =>
                            wallet.address ===
                            userState[message.chat.id].walletAddress
                    );
                    let password = message.text;
                    if (user.password) {
                        if (hashPassword(password) !== user.password) {
                            await bot.sendMessage(
                                message.chat.id,
                                "Password does not match. Try again."
                            );
                            return;
                        }
                    }
                    const privateKey = decryptPrivateKeyWithAddress(
                        wallet.privateKeyEncrypted,
                        password,
                        wallet.address
                    );
                    let gasEstimate = await getGasEstimate(
                        "setMintingEnabled",
                        wallet.address,
                        false
                    );
                    console.log(gasEstimate);
                    await bot.sendMessage(
                        message.chat.id,
                        `Gas price: ${gasEstimate.etherValue} ETH. Are you sure you want to continue?`,
                        {
                            reply_markup: {
                                keyboard: [[{ text: "Yes" }], [{ text: "No" }]],
                                one_time_keyboard: true,
                                resize_keyboard: true,
                            },
                        }
                    );
                    userState[message.chat.id].step = 2;
                    userState[message.chat.id].gasEstimate =
                        gasEstimate.gasEstimate;
                    userState[message.chat.id].gasPrice = gasEstimate.gasPrice;
                    userState[message.chat.id].privateKey = privateKey;
                    userState[message.chat.id].walletAddress = wallet.address;
                } catch (error) {
                    console.error("Error disabling minting:", error);
                    await bot.sendMessage(
                        message.chat.id,
                        "Error disabling minting"
                    );
                }
            } else if (userState[message.chat.id].step === 2) {
                if (message.text === "Yes") {
                    try {
                        let transactionHash = await disableMinting(
                            userState[message.chat.id].walletAddress,
                            userState[message.chat.id].privateKey,
                            userState[message.chat.id].gasEstimate,
                            userState[message.chat.id].gasPrice
                        );
                        await bot.sendMessage(
                            message.chat.id,
                            `Minting disabled successfully\nTransaction hash: ${transactionHash}`
                        );
                    } catch (error) {
                        console.error("Error disabling minting:", error);
                        await bot.sendMessage(
                            message.chat.id,
                            "Error disabling minting"
                        );
                    }
                } else {
                    await bot.sendMessage(
                        message.chat.id,
                        "Minting not disabled"
                    );
                }
                userState[message.chat.id] = { state: "idle" };
            }
            break;
        case "setMintPrice":
            try {
                if (userState[message.chat.id].step === 1) {
                    let price = message.text;
                    let gasEstimate = await getGasEstimate(
                        "setMintPrice",
                        userState[message.chat.id].walletAddress,
                        price
                    );
                    console.log(gasEstimate);
                    await bot.sendMessage(
                        message.chat.id,
                        `Gas price: ${gasEstimate.etherValue} ETH. Are you sure you want to continue?`,
                        {
                            reply_markup: {
                                keyboard: [[{ text: "Yes" }], [{ text: "No" }]],
                                one_time_keyboard: true,
                                resize_keyboard: true,
                            },
                        }
                    );
                    userState[message.chat.id].step = 2;
                    userState[message.chat.id].price = price;
                    userState[message.chat.id].gasEstimate =
                        gasEstimate.gasEstimate;
                    userState[message.chat.id].gasPrice = gasEstimate.gasPrice;
                    break;
                } else if (userState[message.chat.id].step === 2) {
                    if (message.text == "Yes") {
                        userState[message.chat.id].step = 3;
                        await bot.sendMessage(
                            message.chat.id,
                            "Please send your password"
                        );
                    } else {
                        await bot.sendMessage(
                            message.chat.id,
                            "Mint price not set"
                        );
                    }
                    break;
                } else if (userState[message.chat.id].step === 3) {
                    let password = message.text;
                    const user = await getUser(message.from.id);
                    if (user.password) {
                        if (hashPassword(password) !== user.password) {
                            await bot.sendMessage(
                                message.chat.id,
                                "Password does not match. Try again."
                            );
                            return;
                        }
                    }
                    const wallet = user.walletsAssociated.find(
                        (wallet) =>
                            wallet.address ===
                            userState[message.chat.id].walletAddress
                    );
                    const privateKey = decryptPrivateKeyWithAddress(
                        wallet.privateKeyEncrypted,
                        password,
                        wallet.address
                    );
                    let transactionHash = await setMintPrice(
                        userState[message.chat.id].walletAddress,
                        privateKey,
                        userState[message.chat.id].price,
                        userState[message.chat.id].gasEstimate,
                        userState[message.chat.id].gasPrice
                    );
                    await bot.sendMessage(
                        message.chat.id,
                        `Mint price set successfully\nTransaction hash: ${transactionHash}`
                    );
                }
                userState[message.chat.id] = { state: "idle" };
            } catch (error) {
                console.error("Error setting mint price:", error);
                await bot.sendMessage(
                    message.chat.id,
                    "Error setting mint price"
                );
            }
            break;
        case "ownerMint":
            if (userState[message.chat.id].step === 1) {
                try {
                    let password = message.text;
                    const user = await getUser(message.from.id);
                    if (user.password) {
                        if (hashPassword(password) !== user.password) {
                            await bot.sendMessage(
                                message.chat.id,
                                "Password does not match. Try again."
                            );
                            return;
                        }
                    }
                    let maxSupply = await getMaxSupply(
                        userState[message.chat.id].walletAddress
                    );
                    let gasEstimate = await getGasEstimate(
                        "ownerMint",
                        userState[message.chat.id].walletAddress,
                        userState[message.chat.id].walletAddress,
                        `https://raw.githubusercontent.com/stravo1/flow-hackathon-nft-storage/refs/heads/main/FHNFT%23${maxSupply}.json`
                    );
                    console.log(gasEstimate);
                    await bot.sendMessage(
                        message.chat.id,
                        `Gas price: ${gasEstimate.etherValue} ETH. Are you sure you want to continue?`,
                        {
                            reply_markup: {
                                keyboard: [[{ text: "Yes" }], [{ text: "No" }]],
                                one_time_keyboard: true,
                                resize_keyboard: true,
                            },
                        }
                    );
                    let wallet = user.walletsAssociated.find(
                        (wallet) =>
                            wallet.address ===
                            userState[message.chat.id].walletAddress
                    );

                    let privateKey = decryptPrivateKeyWithAddress(
                        wallet.privateKeyEncrypted,
                        password,
                        wallet.address
                    );
                    userState[message.chat.id].step = 2;
                    userState[message.chat.id].gasEstimate =
                        gasEstimate.gasEstimate;
                    userState[message.chat.id].gasPrice = gasEstimate.gasPrice;
                    userState[message.chat.id].privateKey = privateKey;
                    userState[message.chat.id].maxSupply = maxSupply;
                } catch (error) {
                    console.error("Error owner minting:", error);
                    await bot.sendMessage(
                        message.chat.id,
                        "Error owner minting"
                    );
                }
            } else if (userState[message.chat.id].step === 2) {
                if (message.text === "Yes") {
                    mintByOwner(
                        userState[message.chat.id].walletAddress,
                        userState[message.chat.id].privateKey,
                        `https://raw.githubusercontent.com/stravo1/flow-hackathon-nft-storage/refs/heads/main/FHNFT%23${userState[message.chat.id].maxSupply
                        }.json`,
                        userState[message.chat.id].gasEstimate,
                        userState[message.chat.id].gasPrice
                    )
                        .then(async (txHash) => {
                            let lastMessage = await bot.sendMessage(
                                message.chat.id,
                                `NFT minted successfully\nTransaction hash: ${txHash}`
                            );
                            let jsonSchema = createJSONSchemaFileForTokenId(
                                userState[message.chat.id].maxSupply,
                                localDir
                            );
                            let image = createImageFileForTokenId(
                                userState[message.chat.id].maxSupply,
                                localDir
                            );
                            pushFiles(
                                userState[message.chat.id].maxSupply
                            ).then(async () => {
                                await bot.sendPhoto(message.chat.id, image, {
                                    caption: `Name: ${jsonSchema.name}\nDescription: ${jsonSchema.description}`,
                                });
                            })
                            .catch(async (error) => {
                                console.error("Error pushing files:", error);
                                await bot.sendMessage(
                                    message.chat.id,
                                    "Error pushing files"
                                );
                            });
                        })
                        .catch(async (error) => {
                            console.error("Error owner minting:", error);
                            await bot.sendMessage(
                                message.chat.id,
                                "Error owner minting"
                            );
                        });
                } else {
                    await bot.sendMessage(
                        message.chat.id,
                        "Owner mint not confirmed"
                    );
                }
            }
            break;
        default:
            await bot.sendMessage(
                message.chat.id,
                "Please send correct command"
            );
            userState[message.chat.id] = { state: "idle" };
            break;
    }
};

module.exports = userStateHandler;
