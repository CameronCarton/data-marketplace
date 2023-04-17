// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

contract DataMarket{

    address public deployer;
    uint public itemId = 0;


    constructor(){
        deployer = msg.sender;
        itemId=1;
    }

    struct Item {
        address payable owner;
        uint id;
        string name;
        string image;
        string category;
        uint256 price;
        string information;
        string tags;
        string dataSample;
    }

    struct Order{
        address buyer;
        uint256 id;
        uint256 time;
        Item item;
        uint256 complete;
        string gb;
        string gs;
        string data;
    }

    modifier onlyOwner(uint256 _id) {
        require(items[_id].owner == msg.sender, "Account is not the owner of this item.");
        _;
    }
    
    modifier orderExists(uint256 _order, address _buyer) {
        require(orders[msg.sender][_order].buyer == _buyer, "Order does Not Exist.");
        _;
    }

    mapping(uint256 => Item)public items;
    mapping(address => mapping(uint256 => Order)) public orders;
    mapping(uint256 => mapping(address => uint256)) public ordersFulfilled;
    mapping(address => uint256)public userOrders;

    event ListItem(address owner, uint256 itemId, string name, uint256 price);
    event OrderCompleted(address owner, address buyer, uint256 itemId);


    function list(
        address payable _owner,
        string memory _name,
        string memory _image,
        string memory _category,
        uint256 _price,
        string memory _information,
        string memory _tags,
        string memory _dataSample
    ) public {
        //create Item
        Item memory item = Item(_owner,itemId,_name,_image,_category,_price,_information,_tags,_dataSample);

        //save Item
        items[itemId] = item;

        //emit event
        emit ListItem(msg.sender, itemId, _name, _price);

        //increment itemId
        itemId += 1;
    }



    //Buying
    function buy(uint256 _id, string memory _gb) public payable{
        //Fetch item
        Item memory item = items[_id];

        //increment amount of orders in for user
        uint256 newOrderAmount = userOrders[address(item.owner)] + 1;
        userOrders[address(item.owner)] = newOrderAmount;

        //ensure enough ether is sent to buy product
        require(msg.value >= item.price);

        //transfer payment
        payable(address(item.owner)).transfer(item.price);

        //Create order
        Order memory order = Order(msg.sender, newOrderAmount, block.timestamp, item, 1,_gb,"0","");

        //save order
        orders[address(item.owner)][newOrderAmount] = order;
        ordersFulfilled[item.id][msg.sender] = 1;
    }



    //setting Order variables
    function setOrderComplete(
            address _buyer, 
            uint256 _order,
            uint256 _id, 
            uint256 _complete, 
            string memory _gs, 
            string memory _data
    ) public onlyOwner(_id) orderExists(_order,_buyer){

        //get order
        Order storage order = orders[msg.sender][_order];

        order.complete = _complete;
        order.gs = _gs;
        order.data = _data;

        //change order to fulfilled
        ordersFulfilled[_id][_buyer] = 2;

        emit OrderCompleted(msg.sender, _buyer, _id);
    }

}