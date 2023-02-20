const { ethers } = require("hardhat")
const { expect } = require("chai")

describe("DataMarketplace", function() {
  let dataMarket
  let seller, buyer

  const tokens = (n) =>{
    return ethers.utils.parseUnits(n.toString(),'ether')
  }

  //item variables
  const ID = 1
  const NAME = "GeoData"
  const IMAGE = "imageLink"
  const CATEGORY = "Geo Location"
  const PRICE = tokens(1)
  const INFORMATION = "this is a test"

  beforeEach( async function() {
    // Setting up Accounts
    [seller, buyer] = await ethers.getSigners()
    //console.log(seller.address,buyer.address)

    // Deploying Contract
    const DataMarket = await ethers.getContractFactory("DataMarket")
    dataMarket = await DataMarket.deploy()
  })

  describe("Deployment", function() {
    it("Sets the owner", async function() {
      expect(await dataMarket.owner()).to.equal(seller.address)
    })
  })

  //listing test
  describe("Listing", function() {
    let transaction

    this.beforeEach(async function(){
      transaction = await dataMarket.connect(seller).list(ID,NAME,IMAGE,CATEGORY,PRICE,INFORMATION)
      await transaction.wait()
    })

    it("Returns item attributes", async function() {
      const item = await dataMarket.items(ID)
      expect(item.id).to.equal(ID)
      expect(item.name).to.equal(NAME)
      expect(item.image).to.equal(IMAGE)
      expect(item.category).to.equal(CATEGORY)
      expect(item.price).to.equal(PRICE)
      expect(item.information).to.equal(INFORMATION)
    })
  })

  //buying test
  describe("Buying", function() {
    let transaction

    this.beforeEach(async function(){
      transaction = await dataMarket.connect(seller).list(ID,NAME,IMAGE,CATEGORY,PRICE,INFORMATION)
      await transaction.wait()

      transaction = await dataMarket.connect(buyer).buy(ID, {value: PRICE})
    })

    it("Updates the contract balance", async function(){
      const result = await ethers.provider.getBalance(dataMarket.address)
      expect(result).to.equal(PRICE)
    })

    it("Updates buyer's order count", async function(){
      const result = await dataMarket.orderCount(buyer.address)
      expect(result).to.equal(1)
    })

    it("Adds the order", async function(){
      const order = await dataMarket.orders(buyer.address,1)

      expect(order.time).to.be.greaterThan(0)
      expect(order.item.name).to.equal(NAME)
    })

  })

  //withdrawing test
  describe("Withdrawing", function() {
    let balanceBefore

    this.beforeEach(async function(){
      let transaction = await dataMarket.connect(seller).list(ID,NAME,IMAGE,CATEGORY,PRICE,INFORMATION)
      await transaction.wait()

      transaction = await dataMarket.connect(buyer).buy(ID, {value: PRICE})
      await transaction.wait()

      balanceBefore = await ethers.provider.getBalance(seller.address)

      transaction = await dataMarket.connect(seller).withdraw()
      await transaction.wait()
    })

    it("Updates the owner balance", async function(){
      const balanceAfter = await ethers.provider.getBalance(seller.address)
      expect(balanceAfter).to.be.greaterThan(balanceBefore)
    })

    it("Updates the contract balance", async function(){
      const result = await ethers.provider.getBalance(dataMarket.address)
      expect(result).to.equal(0)
    })


  })
})