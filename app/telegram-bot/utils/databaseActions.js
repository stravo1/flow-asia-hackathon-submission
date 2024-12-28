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

module.exports = {
    safeCreateUser,
    attachWalletToUser,
    getUser,
    deleteWalletFromUser
};