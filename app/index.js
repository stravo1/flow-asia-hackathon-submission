const { Web3 } = require('web3');
const FlowHackathonNFT = require("../artifacts/contracts/FlowHackathonNFT.sol/FlowHackathonNFT.json");

const flowHackathonNFTAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
const ownerAccountAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

// event MintPriceUpdated(uint256 newPrice);
// event MintingStatusUpdated(bool enabled);
// event TokenMinted(address indexed _to, uint256 indexed _tokenId, string _uri);
// event NftCreated(uint256 _tokenId, string _uri);
// event NftBought(address _seller, address _buyer, uint256 _price);
// event NftListed(uint256 _tokenId, uint256 _price);
// event NftDelisted(uint256 _tokenId);

async function subscribe() {
    const web3 = new Web3('ws://127.0.0.1:8545');
	// create a new contract object, providing the ABI and address
	const contract = new web3.eth.Contract(FlowHackathonNFT.abi, flowHackathonNFTAddress);

	// subscribe to the smart contract event
    const subscriptionMintPriceUpdated = contract.events.MintPriceUpdated();
    const subscriptionMintingStatusUpdated = contract.events.MintingStatusUpdated();
    const subscriptionNftCreated = contract.events.NftCreated();
    const subscriptionTokenMinted = contract.events.TokenMinted();
    const subscriptionNftBought = contract.events.NftBought();
    const subscriptionNftListed = contract.events.NftListed();
    const subscriptionNftDelisted = contract.events.NftDelisted();
    // console.log(subscription);
	// new value every time the event is emitted
    subscriptionMintPriceUpdated.on('data', (data) => {
        console.log(data.event, data.returnValues);
    });
    subscriptionMintingStatusUpdated.on('data', (data) => {
        console.log(data.event, data.returnValues);
    });
    subscriptionNftCreated.on('data', (data) => {
        console.log(data.event, data.returnValues);
    });
    subscriptionTokenMinted.on('data', (data) => {
        console.log(data.event, data.returnValues);
    });
    subscriptionNftBought.on('data', (data) => {
        console.log(data.event, data.returnValues);
    });
    subscriptionNftListed.on('data', (data) => {
        console.log(data.event, data.returnValues);
    });
    subscriptionNftDelisted.on('data', (data) => {
        console.log(data.event, data.returnValues);
    });
}

// function to unsubscribe from a subscription
async function unsubscribe(subscription) {
	await subscription.unsubscribe();
}

async function main() {
    const web3 = new Web3("http://localhost:8545");

    const blockNumber = await web3.eth.getBlockNumber();
    console.log("Block number:", blockNumber);

    const providersAccounts = await web3.eth.getAccounts();
	const defaultAccount = providersAccounts[0];

    const flowHackathonNFT = new web3.eth.Contract(FlowHackathonNFT.abi, flowHackathonNFTAddress);
    flowHackathonNFT.handleRevert = true;

    try {
		// Get the current value of my number
		const result = await flowHackathonNFT.methods.setMintingEnabled(true).send(
            {
                from: ownerAccountAddress,
            }
        );
        // const result = await flowHackathonNFT.methods.setMintPrice(web3.utils.toWei('0.01', 'ether')).send(
        //     {
        //         from: ownerAccountAddress,
        //     }
        // );
        // // console.log(result);
		// const mintingEnabled = await flowHackathonNFT.methods.mintingEnabled().call();
		// console.log('mintingEnabled value: ' + mintingEnabled)
        // const result = await flowHackathonNFT.methods.safeMint(ownerAccountAddress, "https://raw.githubusercontent.com/stravo1/flow-hackathon-nft-storage/refs/heads/main/FHNFT%231.json").send(
        //     {
        //         from: ownerAccountAddress,
        //     }
        // );
        // console.log(result);
        // const result = await flowHackathonNFT.methods.mint("https://raw.githubusercontent.com/stravo1/flow-hackathon-nft-storage/refs/heads/main/FHNFT%231.json").send(
        //     {
        //         from: defaultAccount,
        //         value: web3.utils.toWei('0.01', 'ether'),
        //     }
        // )
        // const result = await flowHackathonNFT.methods.allowBuy(0, web3.utils.toWei('0.05', 'ether')).send(
        //     {
        //         from: ownerAccountAddress,
        //     }
        // )
        // const result = await flowHackathonNFT.methods.buy(1).send(
        //     {
        //         from: ownerAccountAddress,
        //         value: web3.utils.toWei('0.05', 'ether'),
        //     }
        // )
	} catch (error) {
		console.error(error);
	}
}


subscribe();
main();