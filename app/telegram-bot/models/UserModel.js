const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    address: { type: String, required: true },
    privateKeyEncrypted: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
    telegramId: { type: String, required: true },
    name: { type: String, required: true },
    password: { type: String },
    createdAt: { type: Date, default: Date.now },
    walletsAssociated: { type: [walletSchema], default: [] },
});

module.exports = mongoose.model('User', userSchema);