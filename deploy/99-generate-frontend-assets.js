const { ethers, network } = require("hardhat");
const fs = require("fs");

const FRONTEND_ADDRESSES_FILE =
  "../raffle-nextjs/contracts/contractAddresses.json";
const FRONTEND_ABI_FILE = "../raffle-nextjs/contracts/abi.json";

module.exports = async () => {
  if (process.env.UPDATE_FRONTEND === "true") {
    console.log("Generating FE assets...");
    await updateContractAddresses();
    await updateABI();
  }
};

async function updateABI() {
  const raffle = await ethers.getContract("Raffle");
  console.log("Updating current abi file...");
  fs.writeFileSync(
    FRONTEND_ABI_FILE,
    raffle.interface.format(ethers.utils.FormatTypes.json)
  );
  console.log("Updated current abi file...");
}

async function updateContractAddresses() {
  const raffle = await ethers.getContract("Raffle");
  const chainId = network.config.chainId.toString();
  const currentAddresses = JSON.parse(fs.readFileSync(FRONTEND_ADDRESSES_FILE));
  console.log("Checking current contract addresses file...");
  if (chainId in currentAddresses) {
    if (!currentAddresses[chainId].includes(raffle.address)) {
      currentAddresses[chainId].push(raffle.address);
    }
  } else {
    currentAddresses[chainId] = [raffle.address];
  }
  fs.writeFileSync(FRONTEND_ADDRESSES_FILE, JSON.stringify(currentAddresses));
  console.log("Updated current contract addresses file...");
}

module.exports.tags = ["all", "frontend"];
