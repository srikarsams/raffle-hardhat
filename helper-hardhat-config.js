const networkConfig = {
  4: {
    name: "rinkeby",
    blockConfirmations: 6,
    vrfCoordinatorV2: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
    entranceFee: "100000000000000000",
    gasLane:
      "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
    subscriptionId: "21228", // https://vrf.chain.link/rinkeby/21228
    callbackGasLimit: "500000",
    interval: "30",
  },
  137: {
    name: "polygon",
    blockConfirmations: 6,
  },
  1337: {
    name: "hardhat",
    blockConfirmations: 0,
    entranceFee: "100000000000000000",
    gasLane:
      "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
    callbackGasLimit: "500000",
    interval: "30",
  },
};

const developmentChains = ["hardhat", "localhost"];

module.exports = { networkConfig, developmentChains };
