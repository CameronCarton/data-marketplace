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
        string data;
        string dataSample;
        uint256 amountOfOrders;
    }

    struct Order{
        address buyer;
        uint256 id;
        uint256 time;
        Item item;
        uint256 complete;
        uint256 g;
        uint256 n;
        uint256 gb;
        uint256 gs;
        string data;
    }
    
    mapping(uint256 => Item)public items;
    mapping(address => mapping(uint256 => Order)) public orders;

    event List(string name, uint256 price);

    function list(
        address payable _owner,
        string memory _name,
        string memory _image,
        string memory _category,
        uint256 _price,
        string memory _information,
        string memory _tags,
        string memory _data,
        string memory _dataSample
    ) public {
        //create Item
        Item memory item = Item(_owner,itemId,_name,_image,_category,_price,_information,_tags,_data,_dataSample,0);

        //save Item
        items[itemId] = item;

        //increment itemId
        itemId += 1;
    }

    //Buying
    function buy(uint256 _id, uint256 _g, uint256 _n, uint256 _gb) public payable{
        //Fetch item
        Item memory item = items[_id];

        //increment amount of orders in item
        uint256 newOrderAmount = (item.amountOfOrders) + 1;
        items[_id].amountOfOrders = newOrderAmount;


        //ensure enough ether is sent to buy product
        require(msg.value >= item.price);

        //transfer payment
        payable(address(item.owner)).transfer(item.price);

        //Create order
        Order memory order = Order(msg.sender, newOrderAmount, block.timestamp, item, 1,_g,_n,_gb,0,"");

        //save order
        orders[address(item.owner)][newOrderAmount] = order;

    }

    //setting Order variables
    function setOrderComplete(
            address _owner, 
            address _buyer, 
            uint256 _id, 
            uint256 _complete, 
            uint256 _gs, 
            string memory _data) public {

        //Fetch item
        Item memory item = items[_id];

        //get order that matches
        uint256 len = item.amountOfOrders;

        for (uint256 i = 0; i <= len; i++) {
            Order storage order = orders[_owner][i];

            if(order.buyer == _buyer){
                uint256 id = order.id;

                orders[_owner][id].complete = _complete;
                orders[_owner][id].gs = _gs;
                orders[_owner][id].data = _data;

                break;
            }
        }
    }

}