const mongoose = require('mongoose');

const NFTModel = mongoose.model('NFT', {
    contractAddress: String,
    tokenId: String,
    owner: String,
    metadata: String,
    purchaseEnabled: Boolean,
    purchasePrice: Number, // in ETH
    createdAt: Date,
    lastActivity: Date,
});

module.exports = NFTModel;