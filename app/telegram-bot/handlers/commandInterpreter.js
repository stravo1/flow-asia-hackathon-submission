const { getMintEnabled, getMintPrice, getMaxSupply } = require("../utils/blockchainActions");
const { safeCreateUser, listAllNFTsForUser } = require("../utils/databaseActions");

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
                'Welcome to the NFT Marketplace Bot! 🎨\n\n' +
                '🤖 This bot allows you to:\n' +
                '• Create and manage up to 5 wallets\n' +
                '• Mint unique NFTs with generated artwork\n' +
                '• Buy and sell NFTs in the marketplace\n' +
                '• View your NFT collection\n' +
                '• Manage NFT listings and sales\n\n' +
                '🔐 Security:\n' +
                '• Your wallets are encrypted\n' +
                '• You control your private keys\n' +
                '• Export/backup options available\n\n' +
                '📝 Available Commands:\n\n' +
                '🔑 Wallet Management:\n' +
                '/createwallet - Create a new wallet\n' +
                '/importwallet - Import existing wallet\n' +
                '/getwallets - List your wallets\n' +
                '/exportwallet - Export wallet details\n' +
                '/deletewallet - Remove a wallet\n\n' +
                '🖼 NFT Actions:\n' +
                '/mint - Mint a new NFT\n' +
                '/getnft - Get NFT details\n' +
                '/viewnftlist - View your NFTs\n' +
                '/allowbuy - List NFT for sale\n' +
                '/disallowbuy - Remove NFT from sale\n' +
                '/buy - Buy an NFT\n\n' +
                '⚙️ Admin Commands:\n' +
                '/enableminting - Enable minting\n' +
                '/disableminting - Disable minting\n' +
                '/getmintenabled - Check minting status\n' +
                '/setmintprice - Set minting price\n' +
                '/getmintprice - Get current mint price\n' +
                '/getmaxsupply - Get max supply\n' +
                '/ownermint - Admin minting\n\n' +
                '❓ Need help? Type /help to see this message again.'
            );
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
            await bot.sendMessage(message.chat.id, 
                '📖 Available Commands:\n\n' +
                '🔑 Wallet Management:\n' +
                '/createwallet - Create a new wallet (max 5)\n' +
                '/importwallet - Import existing wallet\n' +
                '/getwallets - List your wallets\n' +
                '/exportwallet - Export wallet details\n' +
                '/deletewallet - Remove a wallet\n\n' +
                '🖼 NFT Actions:\n' +
                '/mint - Mint a new NFT\n' +
                '/getnft - Get NFT details by ID\n' +
                '/getgrid - Get grid by seed\n' +
                '/viewnftlist - View your NFT collection\n' +
                '/allowbuy - List NFT for sale\n' +
                '/disallowbuy - Remove NFT from sale\n' +
                '/buy - Purchase an NFT\n\n' +
                '⚙️ Admin Commands:\n' +
                '/enableminting - Enable minting\n' +
                '/disableminting - Disable minting\n' +
                '/getmintenabled - Check if minting is enabled\n' +
                '/setmintprice - Set NFT minting price\n' +
                '/getmintprice - Get current mint price\n' +
                '/getmaxsupply - Get maximum supply\n' +
                '/getnfturi - Get NFT URI\n' +
                '/ownermint - Admin minting function', 
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
            await bot.sendMessage(message.chat.id, 'Please send a token id');
            userState[message.chat.id] = { state: 'getNFT' };
            break;
        case '/getgrid':
            await bot.sendMessage(message.chat.id, 'Please send a seed');
            userState[message.chat.id] = { state: 'getGrid' };
            break;
        case '/enableminting':
            if (await getMintEnabled(user.walletsAssociated[0].address)) {
                await bot.sendMessage(message.chat.id, 'Minting is already enabled');
                break;
            }
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'You have no wallets associated with your account');
                break;
            }
            await bot.sendMessage(message.chat.id, 'Please select a wallet to send the transaction from', {
                reply_markup: {
                    inline_keyboard: user.walletsAssociated.map((wallet, index) => [
                        { text: `${index + 1}. ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`, callback_data: `enableMinting:${wallet.address}` }
                    ])
                }
            });
            break;
        case '/disableminting':
            if (!(await getMintEnabled(user.walletsAssociated[0].address))) {
                await bot.sendMessage(message.chat.id, 'Minting is already disabled');
                break;
            }
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'You have no wallets associated with your account');
                break;
            }
            await bot.sendMessage(message.chat.id, 'Please select a wallet to send the transaction from', {
                reply_markup: {
                    inline_keyboard: user.walletsAssociated.map((wallet, index) => [
                        { text: `${index + 1}. ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`, callback_data: `disableMinting:${wallet.address}` }
                    ])
                }
            });
            break;
        case '/getmintenabled':
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'You have no wallets associated with your account');
                break;
            }
            await bot.sendMessage(message.chat.id, `Minting is ${await getMintEnabled(user.walletsAssociated[0].address) ? 'enabled' : 'disabled'}`);
            break;
        case '/setmintprice':
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'You have no wallets associated with your account');
                break;
            }
            await bot.sendMessage(message.chat.id, 'Please select a wallet to send the transaction from', {
                reply_markup: {
                    inline_keyboard: user.walletsAssociated.map((wallet, index) => [
                        { text: `${index + 1}. ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`, callback_data: `setMintPrice:${wallet.address}` }
                    ])
                }
            });
            break;
        case '/getmintprice':
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'You have no wallets associated with your account');
                break;
            }
            await bot.sendMessage(message.chat.id, `The mint price is ${await getMintPrice(user.walletsAssociated[0].address)} ETH`);
            break;
        case '/ownermint':
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'You have no wallets associated with your account');
                break;
            }
            await bot.sendMessage(message.chat.id, 'Please select a wallet to send the transaction from', {
                reply_markup: {
                    inline_keyboard: user.walletsAssociated.map((wallet, index) => [
                        { text: `${index + 1}. ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`, callback_data: `ownerMint:${wallet.address}` }
                    ])
                }
            });
            break;
        case '/mint':
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'You have no wallets associated with your account');
                break;
            }
            if (!(await getMintEnabled(user.walletsAssociated[0].address))) {
                await bot.sendMessage(message.chat.id, 'Minting is disabled');
                break;
            }
            await bot.sendMessage(message.chat.id, 'Please select a wallet to send the transaction from', {
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
                    await bot.sendMessage(message.chat.id, 'You have no wallets associated with your account');
                    break;
                }
                let nftsOwned = await listAllNFTsForUser(user);
                if (nftsOwned.length === 0) {
                    await bot.sendMessage(message.chat.id, 'You have no NFTs owned');
                    break;
                }
                await bot.sendMessage(message.chat.id, 'Please select a NFT to view details', {
                    reply_markup: {
                        inline_keyboard: nftsOwned.map((nft, index) => [
                            { text: `${index + 1}. ${JSON.parse(nft.metadata).name}`, callback_data: `viewNFT:${nft.tokenId}` }
                        ])
                    }
                });
            } catch (error) {
                await bot.sendMessage(message.chat.id, 'Error viewing NFT list');
            }
            break;
        case '/allowbuy':
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'You have no wallets associated with your account');
                break;
            }
            let nftsOwned = await listAllNFTsForUser(user);
            if (nftsOwned.length === 0) {
                await bot.sendMessage(message.chat.id, 'You have no NFTs owned');
                break;
            }
            await bot.sendMessage(message.chat.id, 'Please select a NFT to list for sale', {
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
                    await bot.sendMessage(message.chat.id, 'You have no wallets associated with your account');
                    break;
                }
                let nftsOwned = await listAllNFTsForUser(user);
                if (nftsOwned.length === 0) {
                    await bot.sendMessage(message.chat.id, 'You have no NFTs owned');
                    break;
                }
                await bot.sendMessage(message.chat.id, 'Please select a NFT to disallow buying', {
                    reply_markup: {
                        inline_keyboard: nftsOwned.map((nft, index) => [
                            { text: `${index + 1}. ${JSON.parse(nft.metadata).name}`, callback_data: `disallowBuy:${nft.tokenId}` }
                        ])
                    }
                });
            } catch (error) {
                await bot.sendMessage(message.chat.id, 'Error disallowing buy');
            }
            break;
        case '/buy':
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'You have no wallets associated with your account');
                break;
            }
            await bot.sendMessage(message.chat.id, 'Please select a wallet to send the transaction from', {
                reply_markup: {
                    inline_keyboard: user.walletsAssociated.map((wallet, index) => [
                        { text: `${index + 1}. ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`, callback_data: `buy:${wallet.address}` }
                    ])
                }
            });
            break;
        case '/getmaxsupply':
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'You have no wallets associated with your account');
                break;
            }
            await bot.sendMessage(message.chat.id, `The max supply is ${await getMaxSupply(user.walletsAssociated[0].address)}`);
            break;
        case '/getnfturi':
            if (user.walletsAssociated.length === 0) {
                await bot.sendMessage(message.chat.id, 'You have no wallets associated with your account');
                break;
            }
            await bot.sendMessage(message.chat.id, `The NFT URI is ${await getNFTURI(user.walletsAssociated[0].address)}`);
            break;
        default:
            await bot.sendMessage(message.chat.id, 'Unknown command');
            break;
    }
}

module.exports = commandInterpreter;