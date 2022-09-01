const { ethers } = require("hardhat");
const {
  networkConfig,
  developmentChains,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

const VRF_SUBSCRIPTION_FUND_AMOUNT = ethers.utils.parseEther("2");

module.exports = async function ({ getNamedAccounts, deployments, network }) {
  const { deployer } = await getNamedAccounts();
  const { deploy, log } = deployments;
  const chainId = network.config.chainId || 4;
  let vrfCoordinatorV2Address = "";
  let subscriptionId = "";
  const entranceFee = networkConfig[chainId]["entranceFee"];
  const gasLane = networkConfig[chainId]["gasLane"];
  const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"];
  const interval = networkConfig[chainId]["interval"];

  if (developmentChains.includes(network.name)) {
    log("Picking the mock v2coordinator mock address...");
    const vrfCoordinatorV2Mock = await ethers.getContract(
      "VRFCoordinatorV2Mock"
    );
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
    // creating mock vrf subscription
    const txResponse = await vrfCoordinatorV2Mock.createSubscription();
    const txReceipt = await txResponse.wait(1);

    subscriptionId = txReceipt.events[0].args.subId;

    // Fund the subscription
    await vrfCoordinatorV2Mock.fundSubscription(
      subscriptionId,
      VRF_SUBSCRIPTION_FUND_AMOUNT
    );
  } else {
    log("Picking the mock v2coordinator testnet address...");
    vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"];
    subscriptionId = networkConfig[chainId["subscriptionId"]];
  }

  log("Deploying Raffle contract...");
  const raffle = await deploy("Raffle", {
    from: deployer,
    args: [
      vrfCoordinatorV2Address,
      entranceFee,
      gasLane,
      subscriptionId,
      callbackGasLimit,
      interval,
    ],
    log: true,
    waitConfirmations: networkConfig[chainId].blockConfirmations || 1,
  });

  if (!developmentChains.includes(network.name)) {
    log("Verifying...");
    await verify(raffle.address, args);
    log("---------------------------------------------");
  }
};

module.exports.tags = ["all", "raffle"];
