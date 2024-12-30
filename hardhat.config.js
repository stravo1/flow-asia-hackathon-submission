require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    testnet: {
      url: 'https://testnet.evm.nodes.onflow.org',
      accounts: [`${process.env.PRIV_KEY}`], // In practice, this should come from an environment variable and not be commited
      gas: 500000, // Example gas limit
    },
  },
};
