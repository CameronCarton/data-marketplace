// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const {items} = require("../src/items.json")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

async function main() {
  const[seller] = await ethers.getSigners()

  //Deploy
  const DataMarket = await hre.ethers.getContractFactory("DataMarket")
  dataMarket = await DataMarket.deploy()
  await dataMarket.deployed()

  console.log("Deployed DataMarket Contract at: "+ dataMarket.address.toString() +"\n")

  //listing
  for (let i = 0; i < items.length; i++){
    const transaction = await dataMarket.connect(seller).list(
      seller.address,
      items[i].name,
      items[i].image,
      items[i].category,
      tokens(items[i].price),
      items[i].information,
      items[i].tags,
      items[i].data,
      items[i].dataSample,
    )

    await transaction.wait()
    console.log("Listed: "+ items[i].name)
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
