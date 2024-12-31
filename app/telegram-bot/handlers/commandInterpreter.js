const moment = require("moment");
const { getMintEnabled, getMintPrice, getMaxSupply } = require("../utils/blockchainActions");
const { safeCreateUser, listAllNFTsForUser, getNFTDetails, getLatestMintedNFTs, listNFTsForSale } = require("../utils/databaseActions");
const { generateGrid } = require("../utils/utils");

const commandInterpreter = async (message, bot, userState) => {
    let user;
    try {
        user = await safeCreateUser(message.from.id, message.from.username ? message.from.username : message.from.first_name ? message.from.first_name + ' ' + message.from.last_name : message.from.id);
    } catch (error) {
        console.error('Error creating user:', error);
    }
    switch (message.text) {
        case '/start':
            await bot.sendMessage(message.chat.id,
                'Woohoo! Welcome to the most awesome NFT Marketplace Bot in the galaxy! 🚀\n\n' +
                '🤖 Check out what this cool bot can do:\n' +
                '• Create up to 5 wallets (because who doesn\'t need a wallet party? 👛)\n' +
                '• Mint unique NFTs (they\'re like digital pokemon, but cooler! ✨)\n' +
                '• Buy and sell NFTs (become a crypto art mogul! 🎨)\n' +
                '• View your collection (flex those pixels! 💪)\n' +
                '• Manage listings (be your own art dealer! 🎭)\n\n' +
                '🔐 Security Stuff (boring but important!):\n' +
                '• Your wallets are encrypted (Fort Knox style! 🏰)\n' +
                '• You\'re the boss of your keys (no sketchy business here! 🔑)\n' +
                '• Backup options (because losing crypto hurts! 😅)\n\n' +
                '📝 Command List (AKA "Things You Can Make Me Do"):\n\n' +
                '🔑 Wallet Stuff:\n' +
                '/createwallet - Birth a new wallet! 👶\n' +
                '/importwallet - Adopt a wallet! 🏠\n' +
                '/getwallets - Count your wallet children! 👨‍👩‍👧‍👦\n' +
                '/exportwallet - Send a wallet on vacation! ✈️\n' +
                '/deletewallet - Time to say goodbye! 👋\n\n' +
                '🖼 NFT Magic:\n' +
                '/mint - Create digital art like a boss! 🎨\n' +
                '/getnft - Stalk an NFT! 🔍\n' +
                '/viewnftlist - Admire your collection! 🖼\n' +
                '/allowbuy - Put that beauty up for sale! 💰\n' +
                '/disallowbuy - Changed your mind? No prob! 🙅‍♂️\n' +
                '/buy - Throw money at NFTs! 💸\n' +
                '/getnftsforsale - Window shopping time! 🛍\n' +
                '/getlatestminted - See what\'s fresh out of the oven! 🥧\n\n' +
                '🔄 Other Stuff:\n' +
                '/cancel - Oops, nevermind! 🙈\n\n' +
                '⚙️ Super Secret Admin Stuff:\n' +
                '/enableminting - Open the floodgates! 🌊\n' +
                '/disableminting - Close the cookie jar! 🍪\n' +
                '/getmintenabled - Is this thing on? 🎛\n' +
                '/setmintprice - Set the damage! 💵\n' +
                '/getmintprice - How much again? 🤔\n' +
                '/getmaxsupply - Check the limit! 📊\n' +
                '/ownermint - Admin\'s special mint button! 🎯\n\n' +
                '❓ Lost? Confused? Type /help and I\'ll explain it all again! 🤪'
            );
            break;
        case '/createwallet':
            if (user.walletsAssociated.length >= 5) {
                await bot.sendMessage(message.chat.id, 'Whoa there, wallet collector! 🛑 You\'ve already got 5 wallets - any more and they might start a rebellion! Delete some before creating new ones 😅');
                break;
            }
            userState[message.chat.id] = { state: 'createWallet' };
            await bot.sendMessage(message.chat.id, user.password ? 'Time to use that super secret password you already set! 🔐' : 'Quick, think of a password! Make it strong - like your coffee! ☕');
            break;
        case '/importwallet':
            if (user.walletsAssociated.length >= 5) {
                await bot.sendMessage(message.chat.id, 'Hold your horses! 🐎 You\'ve got a full house of wallets already! Time to make some space before importing more! 🏠');
                break;
            }
            userState[message.chat.id] = { state: 'importWallet', step: 1 };
            await bot.sendMessage(message.chat.id, user.password ? 'Remember that password you set? Time to use it! 🗝️' : 'Let\'s set up a password - make it memorable but not "password123" please! 🙈');
            break;
        case '/getwallets':
            let associatedWallets = user.walletsAssociated;
            if (associatedWallets.length === 0) {
                await bot.sendMessage(message.chat.id, 'Your wallet collection is as empty as a programmer\'s coffee cup! ☕ Time to create one! 🎁');
            } else {
                await bot.sendMessage(message.chat.id, 'Behold, your mighty wallet empire! 👑\n' + associatedWallets.map((wallet, index) => `${index + 1}. \`${wallet.address}\``).join('\n'), { parse_mode: 'Markdown' });
            }
            break;
        case '/exportwallet':
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'Houston, we have a problem! 🚀 No wallets found in your space station! Create one first! 🛸');
                break;
            }
            await bot.sendMessage(message.chat.id, 'Pick a wallet to beam up! 🖖', {
                reply_markup: {
                    inline_keyboard: user.walletsAssociated.map((wallet, index) => [
                        { text: `${index + 1}. ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`, callback_data: `exportWallet:${wallet.address}` }
                    ])
                }
            });
            break;
        case '/deletewallet':
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'Can\'t delete what you don\'t have! 🤷‍♂️ Your wallet collection is already empty as my joke book! 📖');
                break;
            }
            await bot.sendMessage(message.chat.id, 'Which wallet should we send to the digital afterlife? 👻', {
                reply_markup: {
                    inline_keyboard: user.walletsAssociated.map((wallet, index) => [
                        { text: `${index + 1}. ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`, callback_data: `deleteWallet:${wallet.address}` }
                    ])
                }
            });
            break;
        case '/help':
            await bot.sendMessage(message.chat.id,
                'Greetings, lost soul! 👋 Let me be your NFT spirit guide! 🧙‍♂️\n\n' +
                'We\'re running on Flow EVM (it\'s like Ethereum\'s cool cousin! 😎)\n' +
                'Using ERC721 standard (fancy way of saying "legit NFTs" 🎨)\n' +
                'All the magic happens on Flow EVM Testnet! ✨\n\n' +
                '📖 Here\'s what you can do (prepare to be amazed!):\n\n' +
                '🔑 Wallet Wizardry:\n' +
                '/createwallet - Spawn a new wallet (max 5, we\'re not octopi! 🐙)\n' +
                '/importwallet - Summon your existing wallet! 🧙‍♀️\n' +
                '/getwallets - Count your digital treasures! 💎\n' +
                '/exportwallet - Pack a wallet for vacation! 🏖️\n' +
                '/deletewallet - Send a wallet to the shadow realm! 👻\n\n' +
                '🖼 NFT Shenanigans:\n' +
                '/mint - Create digital art like Picasso! 🎨\n' +
                '/getnft - Play NFT detective! 🕵️‍♂️\n' +
                '/getgrid - Get grid (it\'s like connect-the-dots but cooler!) 🎲\n' +
                '/viewnftlist - Flex your collection! 💪\n' +
                '/allowbuy - Become a digital merchant! 🏪\n' +
                '/disallowbuy - Changed your mind? No problemo! 🙅‍♂️\n' +
                '/buy - Throw your money at pretty pixels! 💸\n\n' +
                '/getnftsforsale - Window shopping time! 🛍️\n' +
                '/getlatestminted - See what\'s fresh out the NFT oven! 🥧\n\n' +
                '🔄 Misc Stuff:\n' +
                '/cancel - The magical undo button! ⏮️\n\n' +
                '⚙️ Super Secret Admin Stuff:\n' +
                '/enableminting - Green light for NFT party! 🟢\n' +
                '/disableminting - Red light! Stop the party! 🔴\n' +
                '/getmintenabled - Is the party still going? 🎉\n' +
                '/setmintprice - Set the damage to wallets! 💰\n' +
                '/getmintprice - How much are we talking? 🤑\n' +
                '/getmaxsupply - Check the NFT population limit! 📊\n' +
                '/getnfturi - Where\'s the NFT living? 🏠\n' +
                '/ownermint - The boss button! 👑',
                {
                    reply_markup: {
                        keyboard: [
                            [{ text: '/start' }],
                            [{ text: '/createwallet' }, { text: '/getwallets' }],
                            [{ text: '/mint' }, { text: '/viewnftlist' }],
                            [{ text: '/help' }]
                        ],
                        resize_keyboard: true
                    }
                }
            );
            break;
        case '/getnft':
            await bot.sendMessage(message.chat.id, 'Give me that token ID! 🔍 I\'ll find your NFT faster than you can say "blockchain"! 🏃‍♂️');
            userState[message.chat.id] = { state: 'getNFT' };
            break;
        case '/getgrid':
            await bot.sendMessage(message.chat.id, 'Plant a seed and watch the grid grow! 🌱 (Metaphorically speaking, of course!) 🎮');
            userState[message.chat.id] = { state: 'getGrid' };
            break;
        case '/enableminting':
            if (await getMintEnabled(user.walletsAssociated[0].address)) {
                await bot.sendMessage(message.chat.id, 'Oops! Minting is already enabled! 🤦‍♂️ No need to double-dip! 🍪');
                break;
            }
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'No wallets found! 😱 It\'s like trying to cook without a kitchen! 🍳');
                break;
            }
            await bot.sendMessage(message.chat.id, 'Pick your wallet-warrior to enable minting! ⚔️', {
                reply_markup: {
                    inline_keyboard: user.walletsAssociated.map((wallet, index) => [
                        { text: `${index + 1}. ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`, callback_data: `enableMinting:${wallet.address}` }
                    ])
                }
            });
            break;
        case '/disableminting':
            if (!(await getMintEnabled(user.walletsAssociated[0].address))) {
                await bot.sendMessage(message.chat.id, 'Minting is already sleeping! 😴 Let it rest! 💤');
                break;
            }
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'No wallets? That\'s like having a party with no guests! 🎈 Create one first!');
                break;
            }
            await bot.sendMessage(message.chat.id, 'Choose your wallet to pull the plug on minting! 🔌', {
                reply_markup: {
                    inline_keyboard: user.walletsAssociated.map((wallet, index) => [
                        { text: `${index + 1}. ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`, callback_data: `disableMinting:${wallet.address}` }
                    ])
                }
            });
            break;
        case '/getmintenabled':
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'No wallets detected! 📡 Are you trying to check minting status in stealth mode? 🕵️‍♂️');
                break;
            }
            await bot.sendMessage(message.chat.id, `The mint machine is ${await getMintEnabled(user.walletsAssociated[0].address) ? 'ALIVE! 🎉' : 'taking a nap! 😴'}`);
            break;
        case '/setmintprice':
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'No wallets found! 😱 Can\'t set prices in the void! 🌌');
                break;
            }
            await bot.sendMessage(message.chat.id, 'Pick your wallet to set the price! 💰 Choose wisely, young Padawan! 🧙‍♂️', {
                reply_markup: {
                    inline_keyboard: user.walletsAssociated.map((wallet, index) => [
                        { text: `${index + 1}. ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`, callback_data: `setMintPrice:${wallet.address}` }
                    ])
                }
            });
            break;
        case '/getmintprice':
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'No wallets? That\'s like asking for the price without a shopping cart! 🛒');
                break;
            }
            await bot.sendMessage(message.chat.id, `Drumroll please... 🥁 The mint price is ${await getMintPrice(user.walletsAssociated[0].address)} ETH! 💎`);
            break;
        case '/ownermint':
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'No wallets? That\'s like being a superhero without powers! 🦸‍♂️');
                break;
            }
            await bot.sendMessage(message.chat.id, 'Choose your wallet for some admin magic! ✨', {
                reply_markup: {
                    inline_keyboard: user.walletsAssociated.map((wallet, index) => [
                        { text: `${index + 1}. ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`, callback_data: `ownerMint:${wallet.address}` }
                    ])
                }
            });
            break;
        case '/mint':
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'No wallets? That\'s like trying to paint without a canvas! 🎨');
                break;
            }
            if (!(await getMintEnabled(user.walletsAssociated[0].address))) {
                await bot.sendMessage(message.chat.id, 'Minting is hibernating! 🐻 Come back when it wakes up! ⏰');
                break;
            }
            await bot.sendMessage(message.chat.id, 'Time to choose your minting champion! 🏆', {
                reply_markup: {
                    inline_keyboard: user.walletsAssociated.map((wallet, index) => [
                        { text: `${index + 1}. ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`, callback_data: `mint:${wallet.address}` }
                    ])
                }
            });
            break;
        case '/viewnftlist':
            try {
                if (user.walletsAssociated.length === 0) {
                    await bot.sendMessage(message.chat.id, 'No wallets? That\'s like having an art gallery with no walls! 🖼️');
                    break;
                }
                let nftsOwned = await listAllNFTsForUser(user);
                if (nftsOwned.length === 0) {
                    await bot.sendMessage(message.chat.id, 'Your NFT collection is as empty as a programmer\'s social calendar! 📅');
                    break;
                }
                await bot.sendMessage(message.chat.id, 'Pick an NFT to admire! 👀 They\'re all unique, like snowflakes! ❄️', {
                    reply_markup: {
                        inline_keyboard: nftsOwned.map((nft, index) => [
                            { text: `${index + 1}. ${JSON.parse(nft.metadata).name}`, callback_data: `viewNFT:${nft.tokenId}` }
                        ])
                    }
                });
            } catch (error) {
                await bot.sendMessage(message.chat.id, 'Oops! The NFT viewer had a hiccup! 🤧');
            }
            break;
        case '/allowbuy':
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'No wallets? That\'s like opening a shop with no cash register! 💰');
                break;
            }
            let nftsOwned = await listAllNFTsForUser(user);
            if (nftsOwned.length === 0) {
                await bot.sendMessage(message.chat.id, 'Your NFT inventory is emptier than a desert! 🏜️');
                break;
            }
            await bot.sendMessage(message.chat.id, 'Which masterpiece are we putting in the shop window? 🎪', {
                reply_markup: {
                    inline_keyboard: nftsOwned.map((nft, index) => [
                        { text: `${index + 1}. ${JSON.parse(nft.metadata).name}`, callback_data: `allowBuy:${nft.tokenId}` }
                    ])
                }
            });
            break;
        case '/disallowbuy':
            try {
                if (user.walletsAssociated.length === 0) {
                    await bot.sendMessage(message.chat.id, 'No wallets? That\'s like having a "Closed" sign but no shop! 🏪');
                    break;
                }
                let nftsOwned = await listAllNFTsForUser(user);
                if (nftsOwned.length === 0) {
                    await bot.sendMessage(message.chat.id, 'Your NFT shelf is bare as Old Mother Hubbard\'s cupboard! 🥄');
                    break;
                }
                await bot.sendMessage(message.chat.id, 'Which NFT should we take off the market? Time for a vacation! 🏖️', {
                    reply_markup: {
                        inline_keyboard: nftsOwned.map((nft, index) => [
                            { text: `${index + 1}. ${JSON.parse(nft.metadata).name}`, callback_data: `disallowBuy:${nft.tokenId}` }
                        ])
                    }
                });
            } catch (error) {
                await bot.sendMessage(message.chat.id, 'Error! The market gremlins are acting up again! 👺');
            }
            break;
        case '/buy':
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'No wallets? That\'s like going shopping without a wallet! 👛 Oh wait...');
                break;
            }
            await bot.sendMessage(message.chat.id, 'Choose your spending wallet! 💸 Make it rain! 🌧️', {
                reply_markup: {
                    inline_keyboard: user.walletsAssociated.map((wallet, index) => [
                        { text: `${index + 1}. ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`, callback_data: `buy:${wallet.address}` }
                    ])
                }
            });
            break;
        case '/getmaxsupply':
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'No wallets? That\'s like counting inventory in an empty warehouse! 📦');
                break;
            }
            await bot.sendMessage(message.chat.id, `The max supply is ${await getMaxSupply(user.walletsAssociated[0].address)} NFTs! 🎯 That\'s a lot of digital art! 🎨`);
            break;
        case '/getnfturi':
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'No wallets? That\'s like asking for directions without a map! 🗺️');
                break;
            }
            await bot.sendMessage(message.chat.id, `Here\'s where your NFTs live! 🏠 URI: ${await getNFTURI(user.walletsAssociated[0].address)}`);
            break;
        case '/getlatestminted':
            try {
                let latestMintedNFTs = await getLatestMintedNFTs(1, 5);
                let nftData = latestMintedNFTs.map((nft) => {
                    let grid = generateGrid(nft.tokenId);
                    return {
                        type: 'photo',
                        media: grid,
                        caption: `🎯 Token ID: ${nft.tokenId}\n✨ Name: ${JSON.parse(nft.metadata).name}\n👑 Owner: ${nft.owner}\n⏰ Born on: ${moment(nft.createdAt).format('DD/MM/YYYY HH:mm:ss')} \n\n📝 ${JSON.parse(nft.metadata).description} \n\n${nft.purchaseEnabled ? '💰 Price: ' + nft.price + ' ETH' : '🔒 Not for Sale'}`
                    }
                });
                if (nftData.length > 0) {
                    await bot.sendMediaGroup(message.chat.id, nftData);
                } else {
                    await bot.sendMessage(message.chat.id, 'No NFTs found! It\'s quieter than a library in here! 🤫');
                }
                if (latestMintedNFTs.length === 5) {
                    await bot.sendMessage(message.chat.id, 'Fresh out of the NFT oven! 🥧 Want more? Hit that Load More button!', {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: 'Load More', callback_data: 'listNFTs:2' }],
                            ]
                        }
                    });
                }
            } catch (error) {
                await bot.sendMessage(message.chat.id, 'Oops! The NFT radar is having technical difficulties! 📡');
            }
            break;
        case '/getnftsforsale':
            try {
                let nftsForSale = await listNFTsForSale(1, 5);
                if (nftsForSale.length === 0) {
                    await bot.sendMessage(message.chat.id, 'The marketplace is emptier than a pizza box after a hackathon! 🍕');
                    break;
                }
                let nftData = nftsForSale.map((nft) => {
                    let grid = generateGrid(nft.tokenId);
                    return {
                        type: 'photo',
                        media: grid,
                        caption: `🎯 Token ID: ${nft.tokenId}\n✨ Name: ${JSON.parse(nft.metadata).name}\n👑 Owner: ${nft.owner}\n⏰ Listed on: ${moment(nft.createdAt).format('DD/MM/YYYY HH:mm:ss')} \n\n📝 ${JSON.parse(nft.metadata).description} \n\n${nft.purchaseEnabled ? '💰 Price: ' + nft.price + ' ETH' : '🔒 Not for Sale'}`
                    }
                });
                await bot.sendMediaGroup(message.chat.id, nftData);
                if (nftsForSale.length === 5) {
                    await bot.sendMessage(message.chat.id, 'Window shopping time! 🛍️ Remember the token ID if something catches your eye! Want more? Hit that Load More button! 🎯', {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: 'Load More', callback_data: 'listNFTs:2' }],
                            ]
                        }
                    });
                } else {
                    await bot.sendMessage(message.chat.id, 'That\'s all the NFTs in our shop window! 🎪 See something you like? Remember the token ID! 🎯');
                }
            } catch (error) {
                await bot.sendMessage(message.chat.id, 'Oops! The marketplace had a small explosion! 💥 Try again later!');
            }
            break;
        default:
            await bot.sendMessage(message.chat.id, 'Hmm... that command is as mysterious as a cat\'s thoughts! 🐱 Try something from the menu!');
            break;
    }
}

module.exports = commandInterpreter;