require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomiclabs/hardhat-ethers");

const API_KEY = "5ac50e8d6cc44c5f9525479a83699b70"
const fs = require("fs")
const privateKey = fs.readFileSync(".privateKey").toString()


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks:{
    hardhat: {
      chainId: 1337
    },
    goerli: {
      url: "https://goerli.infura.io/v3/${API_KEY}",
      accounts: [privateKey]
    },
    mainnet: {
      url: "https://mainnet.infura.io/v3/${API_KEY}",
      accounts: [privateKey]
    }
  },
  solidity: "0.8.17",
};
