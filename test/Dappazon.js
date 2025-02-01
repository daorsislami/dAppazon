const { expect } = require("chai")

// Testing while developing smart contracts is highly important, once the code is deployed there's no changing back
// so we want to make sure everything is working before deploying

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}


/// Global constants for listing item... 
const ID = 1;
const NAME = "Shoes";
const CATEGORY = "Clothing";

// We won't be storing images in web server, we'll be storing the images in IPFS and we store the URL for the images in our smart contract
// dAppuniversity has tutorials on how to do that on YT
const IMAGE = "https://ipfs.io/ipfs/QmTYEboq8raiBs7GTUg2yLXB3PMz6HuBNgNfSZBx5Msztg/shoes.jpg";
const COST = tokens(1);
const RATING = 4;
const STOCK = 5;


describe("Dappazon", () => {

  let dappazon;
  let deployer;
  let buyer;
  let seller;

  beforeEach(async () => {
    // Setup accounts, Hardhat runs a local blockchain where it creates 20 accounts and assigns crypto for each of them
    // Here we're accessing them and setting up the accounts 
    [deployer, buyer, seller] = await ethers.getSigners();
    //console.log(deployer.address, buyer.address);

    // Deploy contract
    const Dappazon = await ethers.getContractFactory("Dappazon");
    dappazon = await Dappazon.deploy();
  })


  describe("Deployment", async () => {
    
    it("Sets the owner", async () => {
      const owner = await dappazon.owner();
      expect(owner).to.equal(deployer.address);
    })
  })

  describe("Listing", async () => {
    let transaction;

    // What we do here is call the function and then do the tests 
    beforeEach(async () => {

      transaction = await dappazon.connect(deployer).list(
        ID,
        NAME,
        CATEGORY,
        IMAGE,
        COST,
        RATING,
        STOCK
      )

      await transaction.wait();
    })
    
    it("Returns item attributes", async () => {
      const item = await dappazon.items(ID);

      expect(item.id).to.equal(ID);
      expect(item.name).to.equal(NAME);
      expect(item.category).to.equal(CATEGORY);
      expect(item.image).to.equal(IMAGE);
      expect(item.cost).to.equal(COST);
      expect(item.rating).to.equal(RATING);
      expect(item.stock).to.equal(STOCK);

    })

    it('Emits List event', async () => {
      expect(transaction).to.emit(dappazon, "List");
    })

    it('Rejects list being called from other accounts', async () => {     
      await expect(
        dappazon.connect(seller).list(
          ID,
          NAME,
          CATEGORY,
          IMAGE,
          COST,
          RATING,
          STOCK
        )
      ).to.be.reverted;
    })
  })

  describe("Buying", async () => {
    
    let transaction;

    // What we do here is call the function and then do the tests 
    beforeEach(async () => {

      // List an item
      transaction = await dappazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK);
      await transaction.wait();

      // Buy an item
      // ID is the argument that is required, and then you can put the curly brackets to enter function metadata like value
      // value is the amount of ETH we can send in because we got the payable modifier on the buy() 
      transaction = await dappazon.connect(buyer).buy(ID, { value: COST } );
    })

    it("Rejects list being called from other accounts", async () => {     
      await expect(
        dappazon.connect(seller).list(
          ID,
          NAME,
          CATEGORY,
          IMAGE,
          COST,
          RATING,
          STOCK
        )
      ).to.be.reverted;
    })
    
    it("Won't let you buy if cost <= to product price", async () => {
      await expect(dappazon.connect(buyer).buy(ID, { value: tokens(0.5)})).to.be.reverted;    
    })

    it("Requires item is in stock", async () => {
      // we pass in the ID of -1 since we don't have in stock a product with id 999999
      const productId = 999999;
      await expect(dappazon.connect(buyer).buy(productId, { value: tokens(0.5)})).to.be.reverted;    
    })

    it("Updates buyer's order count", async () => {
      const result = await dappazon.orderCount(buyer.address);
      expect(result).to.equal(1);
    })

    it("Adds the order", async () => {
      const order = await dappazon.orders(buyer.address, 1);

      expect(order.time).to.be.greaterThan(0);
      expect(order.item.name).to.equal(NAME); 
    })
        
    it("Updates the contract balance", async () => {
      const result = await ethers.provider.getBalance(dappazon.address)
      expect(result).to.equal(COST)
    })

    it("Emits Buy event", async () => {
      expect(transaction).to.emit(dappazon, "Buy")
    })
  })

  describe("Withdrawing", async () => {
    let balanceBefore; 

    beforeEach(async () => {
      // List a item
      let transaction = await dappazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      await transaction.wait();

      // Buy a item
      transaction = await dappazon.connect(buyer).buy(ID, { value: COST })
      await transaction.wait();

      // Get Deployer balance before
      balanceBefore = await ethers.provider.getBalance(deployer.address)

      // Withdraw
      transaction = await dappazon.withdraw();
      await transaction.wait();
    })

    it("Updates the owner balance", async () => {
      const balanceAfter = await ethers.provider.getBalance(deployer.address)
      expect(balanceAfter).to.be.greaterThan(balanceBefore)
    })

    it("Updates the contract balance", async () => {
      const result = await ethers.provider.getBalance(dappazon.address)

      expect(result).to.equal(0);
    })
  })
})
