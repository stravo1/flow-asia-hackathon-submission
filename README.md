# Flow Asia Hackathon Telegram NFT Bot
A [telegram bot](https://t.me/FAH_NFT_bot) which manages NFTs for you, (with a lot of sass and emojis) !!

## A lil backstory
Hello!
This is a project I developed within a few days after attending the Flow Asia Hackathon World Tour in Kolkata on Dec 21st:  
<img src="me.jpg" >  
Yep, that is me, in blue shirt, enjoying free food 😅  
Never delved in crypto, web3 before so it was rather a "why not?" project. Loved the community, the enthusiasm and support ❤️  
Being a beginner in this area I chose Solidity because honestly the codes in Solidity looked more readable at first glance compared to Cadence and also there were numberous resources available. Openzepplin is godsent 🙏🏼. Without it and ChatGPT this project would not have been possible. 
(Although now I somewhat regret not learning Cadence because it seems so cool!)

## About the project
- It is a small telegram bot which acts as a NFT wallet (could not get time to implement normal fungible token functionality, maybe in the future) and it lets you view mint, sell, buy NFTs. 
- You can create wallets, import and export them as well!
- The smart contract is deployed on the Flow EVM Testnet. Used the Flow CLI to get accounts and fund the address with test tokens.
- Due to time constraint, the art is currently generated on the fly using the `tokenId` but the smart contract has the capability to update the NFT URI if required, so in future users can mint their own NFTs with their own artworks.
- The project uses Github as the NFT storage for a very open and transparent approach.
- And I prompted Copilot to rephrase all the bot messages to be more sassy and have emojis XD.

## How to run it locally
> Pre-requisites: MongoDB (or you can use their cloud service)  

Install the dependencies (yes I love pnpm):  
```bash
pnpm install
```
Compile the smart contract
```bash
pnpm exec hardhat compile
```
Add the env variable (take a look at the `.env.example` file) and run the code
```bash
pnpm start
```
## Future goals (if I chose to develop it further)
- Let users mint their own NFTs with their own artwork
- Full fledged wallet functionality with capabilty of handling ERC20 tokens
- Way better error handling and error messages.