const { default: Web3 } = require("web3");
const {
    enableMinting,
    getGasEstimate,
    disableMinting,
    setMintPrice,
    getMaxSupply,
    mintByOwner,
    getMintPrice,
    mint,
    allowBuy,
    disallowBuy,
    buy,
    getNFTOwner,
} = require("../utils/blockchainActions");
const {
    getUser,
    attachWalletToUser,
    deleteWalletFromUser,
    getNFTDetails,
    createNewNFT,
    changeNFTListingStatus,
    transferNFT,
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
                            "Oopsie! That password is as wrong as wearing socks with sandals! 🧦"
                        );
                        return;
                    }
                }
                if (!checkForStrongPassword(password)) {
                    await bot.sendMessage(
                        message.chat.id,
                        "Your password is weaker than a paper umbrella! Make it at least 8 characters with uppercase, lowercase, and numbers! 💪"
                    );
                    return;
                }
                const wallet = await createNewWallet();
                await attachWalletToUser(user, wallet, password);
                await bot.sendMessage(
                    message.chat.id,
                    `
                    Woohoo! Your wallet just popped into existence like magic! 🎩
                    Your shiny new address is: \`${wallet.address}\`
                    And here's your super secret private key (shhh!): \`${wallet.privateKey}\`
                    Guard this with your life (or at least better than your Netflix password!) 🔐
                    `
                        .split("\n")
                        .map((line) => line.trimStart())
                        .join("\n"),
                    { parse_mode: "MarkdownV2" }
                );
            } catch (error) {
                console.error("Error creating wallet:", error);
                await bot.sendMessage(message.chat.id, "Oops! The wallet factory had a hiccup! 🏭");
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
                    await bot.sendMessage(message.chat.id, "This wallet is playing hide and seek... and winning! 🙈");
                    return;
                }
                let password = message.text;
                if (user.password) {
                    if (hashPassword(password) !== user.password) {
                        await bot.sendMessage(
                            message.chat.id,
                            "That password is as wrong as pineapple on pizza! 🍕"
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
                    `Here's your wallet info, fresh out of the digital oven! 🧁\nAddress: \`${wallet.address}\`\nPrivate Key (super secret!): \`${privateKey}\``,
                    { parse_mode: "MarkdownV2" }
                );
            } catch (error) {
                console.error("Error exporting wallet:", error);
                await bot.sendMessage(
                    message.chat.id,
                    "The export machine broke down faster than my New Year's resolutions! 🎯"
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
                    "Poof! Your wallet just vanished like my motivation on Monday mornings! 💨"
                );
            } catch (error) {
                console.error("Error deleting wallet:", error);
                await bot.sendMessage(message.chat.id, "Houston, we have a problem! The delete button is having an existential crisis! 🚀");
            }
            userState[message.chat.id] = { state: "idle" };
            break;

        case "importWallet":
            try {
                if (userState[message.chat.id].step === 1) {
                    const user = await getUser(message.from.id);
                    let password = message.text;
                    if (user.password) {
                        if (hashPassword(password) !== user.password) {
                            await bot.sendMessage(
                                message.chat.id,
                                "That password is more wrong than wearing a winter coat in summer! ❄️"
                            );
                            return;
                        }
                    }
                    if (!checkForStrongPassword(password)) {
                        await bot.sendMessage(
                            message.chat.id,
                            "Your password needs more muscle! Add some uppercase, lowercase, and numbers! 💪"
                        );
                        return;
                    }
                    userState[message.chat.id].step = 2;
                    userState[message.chat.id].password = password;
                    await bot.sendMessage(
                        message.chat.id,
                        "Time to share your private key! (Don't worry, I'm better at keeping secrets than your best friend! 🤐)"
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
                        "Welcome home, little wallet! We've been expecting you! 🏠"
                    );
                    userState[message.chat.id] = { state: "idle" };
                }
                break;
            } catch (error) {
                console.error("Error importing wallet:", error);
                await bot.sendMessage(
                    message.chat.id,
                    "The import fairy had a rough day! Maybe try again? 🧚‍♀️"
                );
            }
            userState[message.chat.id] = { state: "idle" };
            break;

        case "getNFT":
            try {
                const nftDetails = await getJsonFromTokenId(message.text);
                if (nftDetails == null) {
                    await bot.sendMessage(message.chat.id, "This NFT is playing hide and seek... and it's winning! 🙈");
                    userState[message.chat.id] = { state: "idle" };
                    return;
                }
                const loadingMessage = await bot.sendMessage(
                    message.chat.id,
                    "Summoning your NFT from the digital realm... 🔮"
                );
                getImageFromTokenId(message.text)
                    .then((image) => {
                        bot.deleteMessage(
                            message.chat.id,
                            loadingMessage.message_id
                        );
                        bot.sendPhoto(message.chat.id, image, {
                            caption: `Ta-da! Here's your digital masterpiece! 🎨\nName: ${nftDetails.name}\nDescription: ${nftDetails.description}`,
                        });
                    })
                    .catch((error) => {
                        bot.deleteMessage(
                            message.chat.id,
                            loadingMessage.message_id
                        );
                        bot.sendMessage(
                            message.chat.id,
                            "Oops! The NFT seems to be camera shy! Are you sure that token ID is correct? 📸"
                        );
                    });
            } catch (error) {
                console.error("Error getting NFT:", error);
                await bot.sendMessage(message.chat.id, "The NFT finder is having a coffee break! ☕");
            }
            userState[message.chat.id] = { state: "idle" };
            break;

        case "getGrid":
            const grid = generateGrid(message.text);
            await bot.sendPhoto(message.chat.id, grid, { caption: "Here's your grid, fresh out of the pixel oven! 🎨" });
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
                                "That password is more off than a chocolate teapot! 🍫"
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
                        `Time to pay the gas bill! 💰 It'll cost you ${gasEstimate.etherValue} ETH. Ready to make it rain?`,
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
                        "The minting switch is stuck! Have you tried turning it off and on again? 🔌"
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
                            `The mint is now fresher than your morning breath! 🌿\nTransaction hash: ${transactionHash}`
                        );
                    } catch (error) {
                        console.error("Error enabling minting:", error);
                        await bot.sendMessage(
                            message.chat.id,
                            "The minting machine is throwing a tantrum! 👶"
                        );
                    }
                } else {
                    await bot.sendMessage(
                        message.chat.id,
                        "No minting today! The NFTs will have to wait for their birthday! 🎂"
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
                                "That password is as wrong as a penguin in the desert! 🐧"
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
                        `Gas fees incoming! 🚗 This'll cost you ${gasEstimate.etherValue} ETH. Ready to pull the plug?`,
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
                        "The minting machine is being stubborn! Must be a Monday! 📅"
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
                            `Minting is now sleeping like a cat after lunch! 😴\nTransaction hash: ${transactionHash}`
                        );
                    } catch (error) {
                        console.error("Error disabling minting:", error);
                        await bot.sendMessage(
                            message.chat.id,
                            "The off switch is playing hard to get! 🎮"
                        );
                    }
                } else {
                    await bot.sendMessage(
                        message.chat.id,
                        "Minting stays awake! Party continues! 🎉"
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
                        `The gas meter says ${gasEstimate.etherValue} ETH! Ready to set a price that'll make your wallet cry? 💸`,
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
                            "Time for the secret password! (No, your pet's name isn't secure enough! 🐕)"
                        );
                    } else {
                        await bot.sendMessage(
                            message.chat.id,
                            "Price change cancelled! Your NFTs can keep their old price tag! 🏷️"
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
                                "That password is as wrong as a fish riding a bicycle! 🐠"
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
                        `Price set! Your NFTs are now fancier than a penguin in a tuxedo! 🐧\nTransaction hash: ${transactionHash}`
                    );
                }
                userState[message.chat.id] = { state: "idle" };
            } catch (error) {
                console.error("Error setting mint price:", error);
                await bot.sendMessage(
                    message.chat.id,
                    "The price tag printer is out of ink! 🖨️"
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
                                "That password is more wrong than a snowman in summer! ⛄"
                            );
                            return;
                        }
                    }
                    let maxSupply = Number(await getMaxSupply(
                        userState[message.chat.id].walletAddress
                    ));
                    let gasEstimate = await getGasEstimate(
                        "ownerMint",
                        userState[message.chat.id].walletAddress,
                        userState[message.chat.id].walletAddress,
                        `https://raw.githubusercontent.com/stravo1/${process.env.GITHUB_REPO_NAME}/refs/heads/main/FHNFT%23${maxSupply}.json`
                    );
                    console.log(gasEstimate);
                    await bot.sendMessage(
                        message.chat.id,
                        `Time to pay the gas station! ⛽ This'll cost you ${gasEstimate.etherValue} ETH. Ready to mint like a boss?`,
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
                        "The minting machine is having an identity crisis! 🎭"
                    );
                    userState[message.chat.id] = { state: "idle" };
                }
            } else if (userState[message.chat.id].step === 2) {
                if (message.text === "Yes") {
                    mintByOwner(
                        userState[message.chat.id].walletAddress,
                        userState[message.chat.id].privateKey,
                        `https://raw.githubusercontent.com/stravo1/${process.env.GITHUB_REPO_NAME}/refs/heads/main/FHNFT%23${userState[message.chat.id].maxSupply}.json`,
                        userState[message.chat.id].gasEstimate,
                        userState[message.chat.id].gasPrice
                    )
                        .then(async (txHash) => {
                            let lastMessage = await bot.sendMessage(
                                message.chat.id,
                                `Boom! Your NFT just dropped like my mixtape! 🎵\nTransaction hash: ${txHash}`
                            );
                            const owner = await getNFTOwner(userState[message.chat.id].maxSupply);
                            await createNewNFT(owner, userState[message.chat.id].maxSupply);
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
                                    caption: `Your new digital baby! 👶\nName: ${jsonSchema.name}\nDescription: ${jsonSchema.description}`,
                                });
                            })
                                .catch(async (error) => {
                                    console.error("Error pushing files:", error);
                                    await bot.sendMessage(
                                        message.chat.id,
                                        "The files are being more stubborn than a cat at bath time! 🐱"
                                    );
                                });
                            userState[message.chat.id] = { state: "idle" };
                        })
                        .catch(async (error) => {
                            console.error("Error owner minting:", error);
                            await bot.sendMessage(
                                message.chat.id,
                                "The minting machine is having a bad hair day! 💇‍♀️"
                            );
                            userState[message.chat.id] = { state: "idle" };
                        });
                } else {
                    await bot.sendMessage(
                        message.chat.id,
                        "No minting today! The NFT factory is closed for tea break! ☕"
                    );
                    userState[message.chat.id] = { state: "idle" };
                }
            }
            break;
        case "mint":
            if (userState[message.chat.id].step === 1) {
                try {
                    let password = message.text;
                    const user = await getUser(message.from.id);
                    if (user.password) {
                        if (hashPassword(password) !== user.password) {
                            await bot.sendMessage(message.chat.id, 'That password is as wrong as a vegetarian at a BBQ! 🥩');
                            return;
                        }
                    }
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
                    let maxSupply = await getMaxSupply(
                        userState[message.chat.id].walletAddress
                    );
                    let mintingPrice = await getMintPrice(
                        userState[message.chat.id].walletAddress
                    );
                    let gasEstimate = await getGasEstimate(
                        "mint",
                        userState[message.chat.id].walletAddress,
                        mintingPrice,
                        `https://raw.githubusercontent.com/stravo1/${process.env.GITHUB_REPO_NAME}/refs/heads/main/FHNFT%23${maxSupply}.json`
                    );
                    console.log(gasEstimate);
                    await bot.sendMessage(message.chat.id, `Time to break the piggy bank! 🐷\nMint price: ${mintingPrice} ETH\nGas price: ${gasEstimate.etherValue} ETH\nReady to make it rain?`, {
                        reply_markup: {
                            keyboard: [[{ text: "Yes" }], [{ text: "No" }]],
                            one_time_keyboard: true,
                            resize_keyboard: true,
                        },
                    });
                    userState[message.chat.id].step = 2;
                    userState[message.chat.id].gasEstimate = gasEstimate.gasEstimate;
                    userState[message.chat.id].gasPrice = gasEstimate.gasPrice;
                    userState[message.chat.id].privateKey = privateKey;
                    userState[message.chat.id].maxSupply = maxSupply;
                    userState[message.chat.id].mintingPrice = mintingPrice;
                }
                catch (error) {
                    console.error("Error minting:", error);
                    await bot.sendMessage(message.chat.id, "The mint machine is having a midlife crisis! 😱");
                    userState[message.chat.id] = { state: "idle" };
                }
            } else if (userState[message.chat.id].step === 2) {
                if (message.text === "Yes") {
                    mint(
                        userState[message.chat.id].walletAddress,
                        userState[message.chat.id].privateKey,
                        `https://raw.githubusercontent.com/stravo1/${process.env.GITHUB_REPO_NAME}/refs/heads/main/FHNFT%23${userState[message.chat.id].maxSupply}.json`,
                        userState[message.chat.id].mintingPrice,
                        userState[message.chat.id].gasEstimate,
                        userState[message.chat.id].gasPrice
                    ).then(async (txHash) => {
                        await bot.sendMessage(message.chat.id, `Congratulations! Your NFT just hatched! 🥚\nTransaction hash: ${txHash}`);
                        const owner = await getNFTOwner(userState[message.chat.id].maxSupply);
                        await createNewNFT(owner, userState[message.chat.id].maxSupply);
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
                                caption: `Meet your new digital pet! 🐣\nName: ${jsonSchema.name}\nDescription: ${jsonSchema.description}`,
                            });
                        })
                            .catch(async (error) => {
                                console.error("Error pushing files:", error);
                                await bot.sendMessage(
                                    message.chat.id,
                                    "The files are playing hide and seek! 🙈"
                                );
                            });
                        userState[message.chat.id] = { state: "idle" };
                    }).catch(async (error) => {
                        console.error("Error minting:", error);
                        await bot.sendMessage(message.chat.id, "Oops! Your NFT got stage fright and ran away! 🏃‍♂️");
                        userState[message.chat.id] = { state: "idle" };
                    });
                } else {
                    await bot.sendMessage(message.chat.id, "No problemo! This NFT will stay in its digital egg for now! 🥚");
                    userState[message.chat.id] = { state: "idle" };
                }
            }
            break;
        case 'allowBuy':
            if (userState[message.chat.id].step === 1) {
                try {
                    let password = message.text;
                    const user = await getUser(message.from.id);
                    if (user.password) {
                        if (hashPassword(password) !== user.password) {
                            await bot.sendMessage(message.chat.id, "That password is as wrong as pineapple on pizza! Try again! 🍕");
                            return;
                        }
                    }
                    let nft = await getNFTDetails(userState[message.chat.id].nftId);
                    let walletAddresses = user.walletsAssociated.map(wallet => wallet.address);
                    if (!walletAddresses.includes(nft.owner)) {
                        await bot.sendMessage(message.chat.id, "Nice try, but this NFT belongs to someone else! Sneaky sneaky! 🕵️‍♂️");
                        return;
                    }
                    let wallet = user.walletsAssociated.find(wallet => wallet.address === nft.owner);
                    let privateKey = decryptPrivateKeyWithAddress(wallet.privateKeyEncrypted, password, wallet.address);
                    await bot.sendMessage(message.chat.id, "Time to name your price! Make it rain! 💸");
                    userState[message.chat.id].step = 2;
                    userState[message.chat.id].nftId = nft.tokenId;
                    userState[message.chat.id].privateKey = privateKey;
                    userState[message.chat.id].walletAddress = nft.owner;
                } catch (error) {
                    console.error("Error allowing buy:", error);
                    await bot.sendMessage(message.chat.id, "Houston, we have a problem! The listing machine broke! 🚀💥");
                    userState[message.chat.id] = { state: "idle" };
                }
            } else if (userState[message.chat.id].step === 2) {
                try {
                    let price = message.text;
                    if (price <= 0) {
                        await bot.sendMessage(message.chat.id, "Free stuff is great, but this ain't a charity! Price must be > 0! 🎁");
                        return;
                    }
                    let gasEstimate = await getGasEstimate("allowBuy", userState[message.chat.id].walletAddress, userState[message.chat.id].nftId, price);
                    console.log(gasEstimate);
                    await bot.sendMessage(message.chat.id, `Gas will cost you ${gasEstimate.etherValue} ETH. Ready to set sail? ⛵`, {
                        reply_markup: {
                            keyboard: [[{ text: "Yes" }], [{ text: "No" }]],
                            one_time_keyboard: true,
                            resize_keyboard: true,
                        },
                    });
                    userState[message.chat.id].step = 3;
                    userState[message.chat.id].gasEstimate = gasEstimate.gasEstimate;
                    userState[message.chat.id].gasPrice = gasEstimate.gasPrice;
                    userState[message.chat.id].price = price;
                } catch (error) {
                    console.error("Error allowing buy:", error);
                    await bot.sendMessage(message.chat.id, "The price tag maker ran out of ink! 🏷️💔");
                    userState[message.chat.id] = { state: "idle" };
                }
            } else if (userState[message.chat.id].step === 3) {
                if (message.text === "Yes") {
                    try {
                        let txHash = await allowBuy(userState[message.chat.id].walletAddress, userState[message.chat.id].privateKey, userState[message.chat.id].nftId, userState[message.chat.id].price, userState[message.chat.id].gasEstimate, userState[message.chat.id].gasPrice);
                        changeNFTListingStatus(Number(userState[message.chat.id].nftId), true, Number(userState[message.chat.id].price));
                        await bot.sendMessage(message.chat.id, `Your NFT is now in the shop window! 🏪\nTransaction hash: ${txHash}`);
                    } catch (error) {
                        console.error("Error allowing buy:", error);
                        await bot.sendMessage(message.chat.id, "The NFT slipped on a banana peel on its way to the marketplace! 🍌");
                    }
                } else {
                    await bot.sendMessage(message.chat.id, "Keeping this masterpiece in your private collection? Fancy! 🎨");
                }
                userState[message.chat.id] = { state: "idle" };
            }
            break;
        case 'disallowBuy':
            if (userState[message.chat.id].step === 1) {
                try {
                    let password = message.text;
                    const user = await getUser(message.from.id);
                    if (user.password) {
                        if (hashPassword(password) !== user.password) {
                            await bot.sendMessage(message.chat.id, "That password is more wrong than socks with sandals! Try again! 🧦");
                            return;
                        }
                    }
                    let nft = await getNFTDetails(userState[message.chat.id].nftId);
                    console.log(nft);
                    let walletAddresses = user.walletsAssociated.map(wallet => wallet.address);
                    if (!walletAddresses.includes(nft.owner)) {
                        await bot.sendMessage(message.chat.id, "This NFT isn't yours! No touchy! 🙅‍♂️");
                        return;
                    }
                    let wallet = user.walletsAssociated.find(wallet => wallet.address === nft.owner);
                    let privateKey = decryptPrivateKeyWithAddress(wallet.privateKeyEncrypted, password, wallet.address);

                    let gasEstimate = await getGasEstimate("disallowBuy", nft.owner, userState[message.chat.id].nftId);
                    console.log(gasEstimate);
                    await bot.sendMessage(message.chat.id, `Gas will cost you ${gasEstimate.etherValue} ETH. Ready to pull your NFT from the spotlight? 🎭`, {
                        reply_markup: {
                            keyboard: [[{ text: "Yes" }], [{ text: "No" }]],
                            one_time_keyboard: true,
                            resize_keyboard: true,
                        },
                    });
                    userState[message.chat.id].step = 2;
                    userState[message.chat.id].gasEstimate = gasEstimate.gasEstimate;
                    userState[message.chat.id].gasPrice = gasEstimate.gasPrice;
                    userState[message.chat.id].nftId = nft.tokenId;
                    userState[message.chat.id].privateKey = privateKey;
                    userState[message.chat.id].walletAddress = nft.owner;
                } catch (error) {
                    console.error("Error allowing buy:", error);
                    await bot.sendMessage(message.chat.id, "The NFT is having an identity crisis! 🎭");
                    userState[message.chat.id] = { state: "idle" };
                }
            } else if (userState[message.chat.id].step === 2) {
                if (message.text === "Yes") {
                    try {
                        let txHash = await disallowBuy(userState[message.chat.id].walletAddress, userState[message.chat.id].privateKey, userState[message.chat.id].nftId, userState[message.chat.id].gasEstimate, userState[message.chat.id].gasPrice);
                        changeNFTListingStatus(Number(userState[message.chat.id].nftId), false, 0);
                        await bot.sendMessage(message.chat.id, `Your NFT has left the building! 🏃‍♂️\nTransaction hash: ${txHash}`);
                    } catch (error) {
                        console.error("Error allowing buy:", error);
                        await bot.sendMessage(message.chat.id, "Your NFT is being stubborn and won't leave the marketplace! 🦾");
                    }
                } else {
                    await bot.sendMessage(message.chat.id, "Changed your mind? Your NFT is still strutting its stuff in the marketplace! 💃");
                }
                userState[message.chat.id] = { state: "idle" };
            }
            break;

        case 'buy':
            if (userState[message.chat.id].step === 1) {
                try {
                    let password = message.text;
                    const user = await getUser(message.from.id);
                    if (user.password) {
                        if (hashPassword(password) !== user.password) {
                            await bot.sendMessage(message.chat.id, "That password is more off than a penguin in the desert! 🐧");
                            return;
                        }
                    }
                    let wallet = user.walletsAssociated.find(wallet => wallet.address === userState[message.chat.id].walletAddress);
                    let privateKey = decryptPrivateKeyWithAddress(wallet.privateKeyEncrypted, password, wallet.address);
                    await bot.sendMessage(message.chat.id, "Which digital treasure catches your eye? Drop that NFT ID! 👀");
                    userState[message.chat.id].step = 2;
                    userState[message.chat.id].privateKey = privateKey;
                } catch (error) {
                    console.error("Error buying:", error);
                    await bot.sendMessage(message.chat.id, "The shopping cart crashed into a virtual wall! 🛒💥");
                    userState[message.chat.id] = { state: "idle" };
                }
            } else if (userState[message.chat.id].step === 2) {
                try {
                    let nftId = message.text;
                    let nft = await getNFTDetails(nftId);
                    if (!nft || nft.purchasePrice === 0) {
                        await bot.sendMessage(message.chat.id, "This NFT is playing hard to get - it's not for sale! 💔");
                        return;
                    }
                    let gasEstimate = await getGasEstimate("buy", userState[message.chat.id].walletAddress, nft.purchasePrice, nftId);
                    console.log(gasEstimate);
                    await bot.sendMessage(message.chat.id, `Time to break the piggy bank! 🐷\nNFT price: ${Web3.utils.fromWei(nft.purchasePrice, "ether")} ETH\nGas price: ${gasEstimate.etherValue} ETH\nReady to make it rain? 💸`, {
                        reply_markup: {
                            keyboard: [[{ text: "Yes" }], [{ text: "No" }]],
                            one_time_keyboard: true,
                            resize_keyboard: true,
                        },
                    });
                    userState[message.chat.id].step = 3;
                    userState[message.chat.id].nftId = nftId;
                    userState[message.chat.id].gasEstimate = gasEstimate.gasEstimate;
                    userState[message.chat.id].gasPrice = gasEstimate.gasPrice;
                    userState[message.chat.id].price = nft.purchasePrice;
                } catch (error) {
                    console.error("Error buying:", error);
                    await bot.sendMessage(message.chat.id, "The crypto gods are taking a coffee break! ☕");
                    userState[message.chat.id] = { state: "idle" };
                }
            } else if (userState[message.chat.id].step === 3) {
                if (message.text === "Yes") {
                    try {
                        let txHash = await buy(userState[message.chat.id].walletAddress, userState[message.chat.id].privateKey, userState[message.chat.id].price, userState[message.chat.id].nftId, userState[message.chat.id].gasEstimate, userState[message.chat.id].gasPrice);
                        transferNFT(Number(userState[message.chat.id].nftId), userState[message.chat.id].walletAddress);
                        await bot.sendMessage(message.chat.id, `Cha-ching! The NFT is yours! 🎉\nTransaction hash: ${txHash}`);
                    } catch (error) {
                        console.error("Error buying:", error);
                        await bot.sendMessage(message.chat.id, "Your virtual shopping cart tipped over! 🛒💫");
                    }
                } else {
                    await bot.sendMessage(message.chat.id, "Window shopping is fun too! Maybe next time! 🪟");
                }
                userState[message.chat.id] = { state: "idle" };
            }
            break;
        default:
            await bot.sendMessage(
                message.chat.id,
                "Whoopsie! That command is as lost as a vegetarian in a steakhouse! 🥩"
            );
            userState[message.chat.id] = { state: "idle" };
            break;
    }
};

module.exports = userStateHandler;
