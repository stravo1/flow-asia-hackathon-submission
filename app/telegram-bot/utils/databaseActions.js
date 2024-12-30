const { default: axios } = require('axios');
const NFTModel = require('../models/NFTModel');
const UserModel = require('../models/UserModel');
const { encryptPrivateKeyWithAddress, hashPassword } = require('./utils');

const safeCreateUser = async (telegramUserId, name) => {
    const user = await UserModel.findOne({ telegramId: telegramUserId });
    if (!user) {
        const newUser = new UserModel({ telegramId: telegramUserId, name: name });
        await newUser.save();
        console.log('User created');
        return newUser;
    }
    console.log('User already exists');
    return user;
};

const getUser = async (telegramUserId) => {
    const user = await UserModel.findOne({ telegramId: telegramUserId });
    return user;
}

const attachWalletToUser = async (user, wallet, password) => {
    const hashedPassword = hashPassword(password);
    const encryptedPrivateKey = encryptPrivateKeyWithAddress(wallet.privateKey, password, wallet.address);
    user.password = hashedPassword;
    user.walletsAssociated.push({
        address: wallet.address,
        privateKeyEncrypted: encryptedPrivateKey
    });
    await user.save();
    return user;
}

const deleteWalletFromUser = async (user, walletAddress) => {
    user.walletsAssociated = user.walletsAssociated.filter(wallet => wallet.address !== walletAddress);
    await user.save();
    return user;
}

const createNewNFT = async (address, nftId) => {
    const metadata = {
        name: `FHNFT#${nftId}`,
        description: `Flow Hackathon NFT #${nftId}`,
        image: `https://raw.githubusercontent.com/stravo1/${process.env.GITHUB_REPO_NAME}/refs/heads/main/FHNFT%23${nftId}.png`,
    }
    const newNFT = new NFTModel(
        {
            contractAddress: process.env.NFT_CONTRACT_ADDRESS,
            tokenId: nftId,
            owner: address,
            metadata: JSON.stringify(metadata),
            purchaseEnabled: false,
            purchasePrice: 0,
            createdAt: new Date(),
            lastActivity: new Date()
        }
    );
    console.log("newNFT: ", newNFT);
    await newNFT.save();
    return newNFT;
}

const changeNFTListingStatus = async (nftId, purchaseEnabled, purchasePrice) => {
    const nft = await NFTModel.findOne({ tokenId: nftId });
    nft.purchaseEnabled = purchaseEnabled;
    nft.purchasePrice = purchasePrice;
    nft.lastActivity = new Date();
    await nft.save();
    return nft;
}

const transferNFT = async (nftId, to) => {
    const nft = await NFTModel.findOne({ tokenId: nftId });
    nft.owner = to;
    nft.lastActivity = new Date();
    await nft.save();
    return nft;
}

const getNFTDetails = async (nftId) => {
    const nft = await NFTModel.findOne({ tokenId: nftId });
    return nft;
}

const listAllNFTsForUser = async (user) => {
    const userWallets = user.walletsAssociated.map(wallet => wallet.address);
    const nfts = await NFTModel.find({ owner: { $in: userWallets } });
    return nfts;
}

const listNFTsForSale = async () => {
    const nfts = await NFTModel.find({ purchaseEnabled: true });
    return nfts;
}

const getOwnerOfNFT = async (nftId) => {
    const nft = await NFTModel.findOne({ tokenId: nftId });
    return nft.owner;
}

const checkIfNFTBelongsToUser = async (nftId, user) => {
    const nft = await NFTModel.findOne({ tokenId: nftId });
    const userWallets = user.walletsAssociated.map(wallet => wallet.address);
    return userWallets.includes(nft.owner);
}

module.exports = {
    safeCreateUser,
    attachWalletToUser,
    getUser,
    deleteWalletFromUser,
    createNewNFT,
    changeNFTListingStatus,
    transferNFT,
    listAllNFTsForUser,
    listNFTsForSale,
    getOwnerOfNFT,
    checkIfNFTBelongsToUser,
    getNFTDetails
};