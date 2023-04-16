

const hre = require("hardhat");
const {items} = require("../src/items.json")



//token conversion
const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether');
}


//Deploy
async function main() {

  //getting signer
  const[seller] = await ethers.getSigners();

  //Deploying contract to Network
  const DataMarket = await hre.ethers.getContractFactory("DataMarket");
  const dataMarket = await DataMarket.deploy();
  await dataMarket.deployed();
  console.log("Deployed DataMarket Contract at: "+ dataMarket.address.toString() +"\n");


  //listing Sample Sales
  //This is so I don't have to manually list a load of sales myself
  for (let i = 0; i < items.length; i++){
    const transaction = await dataMarket.connect(seller).list(
      seller.address,
      items[i].name,
      items[i].image,
      items[i].category,
      tokens(items[i].price),
      items[i].information,
      items[i].tags,
      items[i].dataSample,
    )

    await transaction.wait();
    console.log("Listed: "+ items[i].name);
  }
}


// Hardhat Default Information
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
