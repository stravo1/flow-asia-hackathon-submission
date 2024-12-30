// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const initialOwnerAddress = "0xf8e80F7183DE9B865e9f087e899CC2Cb06BAAB5B";

module.exports = buildModule("FlowHackathonNFT", (m) => {
  const initialOwner = m.getParameter("initialOwner", initialOwnerAddress);

  const flowHackathonNFT = m.contract("FlowHackathonNFT", [initialOwner]);


  return { flowHackathonNFT };
});
