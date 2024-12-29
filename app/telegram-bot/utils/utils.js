const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const { default: axios } = require('axios');
const crypto = require('crypto');
const { Web3 } = require('web3');
const { createCanvas } = require('canvas');
const fs = require('fs');

function generateComplementaryPastelColors(seed) {
    // Seeded random function
    function seededRandom(seed) {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    // Generate a random hue and lightness for the first color
    const baseHue = Math.floor(seededRandom(seed) * 360);
    const lightness1 = Math.floor(seededRandom(seed + 1) * 20) + 80; // Light pastel (80% to 100% lightness)
    const saturation1 = Math.floor(seededRandom(seed + 2) * 20) + 60; // 60% to 80% saturation

    // Generate complementary color
    const complementaryHue = (baseHue + 180) % 360;
    const lightness2 = Math.floor(seededRandom(seed + 3) * 20) + 40; // Darker pastel (40% to 60% lightness)
    const saturation2 = Math.floor(seededRandom(seed + 4) * 20) + 40; // 40% to 60% saturation

    // Convert HSL to CSS color strings
    const color1 = `hsl(${baseHue}, ${saturation1}%, ${lightness1}%)`;
    const color2 = `hsl(${complementaryHue}, ${saturation2}%, ${lightness2}%)`;

    return { light: color1, dark: color2 };
}


function generateGrid(seed) {
    const canvasSize = 360;
    const gridSize = 12;
    const boxSize = canvasSize / gridSize;

    // Create the canvas
    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    // Seeded random function
    function seededRandom(seed) {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    // Set the seed for repeatable results
    let randomSeed = seed;
    const colors = generateComplementaryPastelColors(seed);

    // Generate the grid
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const colorValue = seededRandom(randomSeed++) > ((seed % 3) + 2) / 10 ? colors.light : colors.dark;
            ctx.fillStyle = colorValue;
            ctx.fillRect(x * boxSize, y * boxSize, boxSize, boxSize);
        }
    }

    // Save the canvas to a file
    const buffer = canvas.toBuffer('image/png');
    return buffer;
}

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

const getJsonFromTokenId = async (tokenId) => {
    try {
        const response = await axios.get(`https://raw.githubusercontent.com/stravo1/flow-hackathon-nft-storage/refs/heads/main/FHNFT%23${tokenId}.json`);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error(error);
        return null;
    }
}

const getImageFromTokenId = async (tokenId) => {
    try {
        const response = await axios.get(`https://raw.githubusercontent.com/stravo1/flow-hackathon-nft-storage/refs/heads/main/FHNFT%23${tokenId}.png`,
            {
                responseType: 'stream'
            }
        );
        return response.data;
    } catch (error) {
        console.error(error);
        return null;
    }
}

const createJSONSchemaFileForTokenId = (tokenId, path) => {
    const jsonSchema = {
        name: `FHNFT#${tokenId}`,
        description: `Flow Hackathon NFT #${tokenId}`,
        image: `https://raw.githubusercontent.com/stravo1/flow-hackathon-nft-storage/refs/heads/main/FHNFT%23${tokenId}.png`
    }
    // save it in a file
    fs.writeFileSync(`${path}/FHNFT#${tokenId}.json`, JSON.stringify(jsonSchema));
    return jsonSchema;
}

const createImageFileForTokenId = (tokenId, path) => {
    const image = generateGrid(parseInt(tokenId));
    fs.writeFileSync(`${path}/FHNFT#${tokenId}.png`, image);
    return image;
}

module.exports = {
    getPubKeyFromPrivateKey,
    createNewWallet,
    encryptPrivateKeyWithAddress,
    decryptPrivateKeyWithAddress,
    checkForStrongPassword,
    hashPassword,
    importWallet,
    getJsonFromTokenId,
    getImageFromTokenId,
    generateGrid,
    createJSONSchemaFileForTokenId,
    createImageFileForTokenId
}