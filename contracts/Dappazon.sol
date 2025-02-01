// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Dappazon {

    address public owner; // owner of the ecommerce 

    // How do you model a product in blockchain?
    // Solidity has something called structs which lets you create your own arbitrary data types 
    struct Item {
        uint256 id;
        string name;
        string category;
        string image;
        uint256 cost;
        uint256 rating;
        uint256 stock;
    }


    struct Order {
        uint256 time;
        Item item;
    }

    // mapping is a data structure in Solidity that lets us treat the blockchain like a database  
    mapping(uint256 => Item) public items;

 
    // mapping for storing the orders count
    // here we store the user that created the order and the order itself in value 
    mapping(address => uint256) public orderCount;

    // mapping for storing total orders
    // This is a nested mapping
    // So address is the key so the user who placed the order and as value we have a mapping of the quantity of products for each individual order
    mapping(address => mapping(uint256 => Order)) public orders;

  
    // Solidity lets you create your own events that can be emitted inside functions and this has 2 primary benefits
    // 1. Anytime this functions is called e.g. list() somebody could subscribe to the event in order to get a notification about it
    //    maybe to push a notification on your phone, maybe it's an alert that pops up on your website, maybe it's an e-mail alert
    //    whatever it is, you could subscribe to that event with something like Ether.js and program it to do whatever you want to do   
    // 
    // 2. You can look every single time this function was ever called on the blockchain very easily by fetching the event stream
    //    and looking at every single time a product was listed
    event List(string name, uint256 cost, uint256 quantity );

    event Buy(address buyer, uint256 orderId, uint256 itemId);

    constructor() {
    
        // Solidity has a global variable called msg 
        // Anytime that you're making a transaction you can also see whos sending that transaction, who signed it etc.
        // msg.sender is the person whos deploying the smart contract to the blockchain, and the person who deploys it pays gas fee
        owner = msg.sender; 
    }


    // A modifier is something you can apply to your functions, very good way for gas efficieny
    // Anytime we put anything to this function it needs to valuate either to true or false, 
    // if true solidity will continue executing this function otherwise will stop and transaction won't finish
    // NOTE: For this example we're setting it up that only the owner(who deploys smart contract) will be able to call list function
    //       So only the owner will be able to list products, otherwise we would remove the require function or enhance it so that
    //       other users would be able to also list
    modifier onlyOwner {
        require(msg.sender == owner);
        _; // this represents the function body, basically saying check require() before executing the function body 
    }


    // List products
    function list(
        uint256 _id, 
        string memory _name, // memory is the data location
        string memory _category,
        string memory _image,
        uint256 _cost,
        uint256 _rating,
        uint256 _stock
    ) public onlyOwner {

        // Create Item Struct 
        Item memory item = Item(_id, _name, _category, _image, _cost, _rating, _stock);

        // Save Item Struct to blockchain
        items[_id] = item;

        // Emit an event in blockchain
        emit List(_name, _cost, _stock);
    }


    // Buy products
    // payable it's a modifier that is in built to Solidity that you can apply to the function, it allows people to send in ETH 
    // when they call this function 
    function buy(uint256 _id) public payable{
        // Receive Crypto

        // Fetch an item from blockchain
        Item memory item = items[_id];

        // Require enough ether to buy item
        require(msg.value >= item.cost);

        // Require item is in stock
        require(item.stock > 0);

        // Create an order
        // Each order needs to have a timestamp so we know when it was created
        // block.timestamp is a global variable in Solidity just like msg.sender
        Order memory order = Order(block.timestamp, item);

        // Add order for user 
        orderCount[msg.sender]++; // <-- Order ID
        orders[msg.sender][orderCount[msg.sender]] = order;

        // Subtract stock
        items[_id].stock = item.stock - 1;

        // Emit event
        emit Buy(msg.sender, orderCount[msg.sender], item.id);
    }


    // Withdraw funds, for the persons who owns the marketplace
    // Solidity has multiple ways for you to transfer ETH inside of smart contracts, you can use the transfer function which we're not 
    // doing in this case. We're going to use 'call' which is a preferred pattern that Solidity developers use  
    function withdraw() public onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success);
    }


    // Returns the balance of the smart contract
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
