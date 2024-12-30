const { Web3 } = require("web3");
const FlowHackathonNFT = require("../../../artifacts/contracts/FlowHackathonNFT.sol/FlowHackathonNFT.json");
require("dotenv").config();

const getGasEstimate = async (methodName, fromAddress, ...argsArray) => {
    const web3 = new Web3(process.env.FLOW_RPC_URL);
    if (methodName === "setMintPrice") {
        argsArray[0] = web3.utils.toWei(argsArray[0].toString(), "ether");
    }
    if (methodName === "mint") {
        argsArray[0] = web3.utils.toWei(argsArray[0].toString(), "ether");
    }
    console.log(methodName, argsArray, fromAddress);
    const contract = new web3.eth.Contract(
        FlowHackathonNFT.abi,
        process.env.FLOW_HACKATHON_NFT_ADDRESS
    );
    const gasEstimate = await contract.methods[methodName](
        ...(methodName === "mint" ? argsArray.slice(1) : argsArray)
    ).estimateGas({
        from: fromAddress,
        ...(methodName === "mint" ? { value: argsArray[0] } : {}),
    });
    const gasPrice = await web3.eth.getGasPrice();
    return {
        gasEstimate,
        gasPrice,
        etherValue: web3.utils.fromWei(gasEstimate * gasPrice, "ether"),
    };
};

const enableMinting = async (address, privateKey, gasEstimate, gasPrice) => {
    const web3 = new Web3(process.env.FLOW_RPC_URL);
    const contract = new web3.eth.Contract(
        FlowHackathonNFT.abi,
        process.env.FLOW_HACKATHON_NFT_ADDRESS
    );

    // Get the sender account address and private key
    const senderAddress = address;

    // Create the transaction object
    const tx = {
        from: senderAddress,
        to: process.env.FLOW_HACKATHON_NFT_ADDRESS,
        data: contract.methods.setMintingEnabled(true).encodeABI(),
        gas: gasEstimate,
        gasPrice: gasPrice,
    };

    // Sign the transaction with the private key
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);

    // Send the signed transaction
    const receipt = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
    );
    console.log("Transaction Hash:", receipt.transactionHash);
    return receipt.transactionHash;
};

const disableMinting = async (address, privateKey, gasEstimate, gasPrice) => {
    const web3 = new Web3(process.env.FLOW_RPC_URL);
    const contract = new web3.eth.Contract(
        FlowHackathonNFT.abi,
        process.env.FLOW_HACKATHON_NFT_ADDRESS
    );

    // Get the sender account address and private key
    const senderAddress = address;

    // Create the transaction object
    const tx = {
        from: senderAddress,
        to: process.env.FLOW_HACKATHON_NFT_ADDRESS,
        data: contract.methods.setMintingEnabled(false).encodeABI(),
        gas: gasEstimate,
        gasPrice: gasPrice,
    };

    // Sign the transaction with the private key
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);

    // Send the signed transaction
    const receipt = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
    );
    console.log("Transaction Hash:", receipt.transactionHash);
    return receipt.transactionHash;
};

const getMintEnabled = async (address) => {
    const web3 = new Web3(process.env.FLOW_RPC_URL);
    const contract = new web3.eth.Contract(
        FlowHackathonNFT.abi,
        process.env.FLOW_HACKATHON_NFT_ADDRESS
    );
    const mintEnabled = await contract.methods
        .mintingEnabled()
        .call({ from: address });
    return mintEnabled;
};

const setMintPrice = async (
    address,
    privateKey,
    price,
    gasEstimate,
    gasPrice
) => {
    const web3 = new Web3(process.env.FLOW_RPC_URL);
    const processedPrice = web3.utils.toWei(price.toString(), "ether");
    const contract = new web3.eth.Contract(
        FlowHackathonNFT.abi,
        process.env.FLOW_HACKATHON_NFT_ADDRESS
    );
    const tx = {
        from: address,
        to: process.env.FLOW_HACKATHON_NFT_ADDRESS,
        data: contract.methods.setMintPrice(processedPrice).encodeABI(),
        gas: gasEstimate,
        gasPrice: gasPrice,
    };
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
    );
    console.log("Transaction Hash:", receipt.transactionHash);
    return receipt.transactionHash;
};

const getMintPrice = async (address) => {
    const web3 = new Web3(process.env.FLOW_RPC_URL);
    const contract = new web3.eth.Contract(
        FlowHackathonNFT.abi,
        process.env.FLOW_HACKATHON_NFT_ADDRESS
    );
    const price = await contract.methods.mintPrice().call({ from: address });
    return web3.utils.fromWei(price, "ether");
};

const getMaxSupply = async (address) => {
    const web3 = new Web3(process.env.FLOW_RPC_URL);
    const contract = new web3.eth.Contract(
        FlowHackathonNFT.abi,
        process.env.FLOW_HACKATHON_NFT_ADDRESS
    );
    const maxSupply = await contract.methods
        .getTotalSupply()
        .call({ from: address });
    return maxSupply;
};

const mintByOwner = async (address, privateKey, uri, gasEstimate, gasPrice) => {
    const web3 = new Web3(process.env.FLOW_RPC_URL);
    const contract = new web3.eth.Contract(
        FlowHackathonNFT.abi,
        process.env.FLOW_HACKATHON_NFT_ADDRESS
    );
    const tx = {
        from: address,
        to: process.env.FLOW_HACKATHON_NFT_ADDRESS,
        data: contract.methods.ownerMint(address, uri).encodeABI(),
        gas: gasEstimate,
        gasPrice: gasPrice,
    };
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
    );
    console.log("Transaction Hash:", receipt.transactionHash);
    return receipt.transactionHash;
};

const mint = async (address, privateKey, uri, price, gasEstimate, gasPrice) => {
    const web3 = new Web3(process.env.FLOW_RPC_URL);
    const contract = new web3.eth.Contract(
        FlowHackathonNFT.abi,
        process.env.FLOW_HACKATHON_NFT_ADDRESS
    );
    const tx = {
        from: address,
        to: process.env.FLOW_HACKATHON_NFT_ADDRESS,
        data: contract.methods.mint(uri).encodeABI(),
        gas: gasEstimate,
        gasPrice: gasPrice,
        value: web3.utils.toWei(price.toString(), "ether"),
    };
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
    );
    console.log("Transaction Hash:", receipt.transactionHash);
    return receipt.transactionHash;
};

module.exports = {
    enableMinting,
    disableMinting,
    getGasEstimate,
    getMintEnabled,
    setMintPrice,
    getMintPrice,
    mintByOwner,
    getMaxSupply,
    mint,
};
