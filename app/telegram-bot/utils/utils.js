const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const crypto = require('crypto');
const { Web3 } = require('web3');

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Function to encrypt the private key using a wallet address as IV
function encryptPrivateKeyWithAddress(privateKey, password, walletAddress) {
    const iv = Buffer.from(walletAddress.slice(2, 34), 'hex'); // Use first 16 bytes of address as IV
    const key = crypto.scryptSync(password, 'salt', 32); // Derive key from password
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return encrypted;
}

// Function to decrypt the private key using a wallet address as IV
function decryptPrivateKeyWithAddress(encryptedData, password, walletAddress) {
    const iv = Buffer.from(walletAddress.slice(2, 34), 'hex'); // Use first 16 bytes of address as IV
    const key = crypto.scryptSync(password, 'salt', 32); // Derive key from password
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

const getPubKeyFromPrivateKey = (privateKey) => {
    const web3 = new Web3();
    // Ethereum address from the private key
    const address = web3.eth.accounts.privateKeyToAccount(privateKey).address;
    return address;
}

const createNewWallet = async () => {
    const web3 = new Web3();
    const account = web3.eth.accounts.create();
    return {
        address: account.address,
        privateKey: account.privateKey
    }
}

const checkForStrongPassword = (password) => {
    return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
}

const importWallet = async (privateKey) => {
    const web3 = new Web3();
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    return {
        address: account.address,
        privateKey: account.privateKey
    }
}

module.exports = {
    getPubKeyFromPrivateKey,
    createNewWallet,
    encryptPrivateKeyWithAddress,
    decryptPrivateKeyWithAddress,
    checkForStrongPassword,
    hashPassword,
    importWallet
}