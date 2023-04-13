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
    }

    struct Order{
        uint256 time;
        Item item;
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
        Item memory item = Item(_owner,itemId,_name,_image,_category,_price,_information,_tags,_data,_dataSample);

        //save Item
        items[itemId] = item;

        //increment itemId
        itemId += 1;
    }

    //Buying
    function buy(uint256 _id) public payable{
        //Fetch item
        Item memory item = items[_id];

        //ensure enough ether is sent to buy product
        require(msg.value >= item.price);

        //transfer payment
        payable(address(item.owner)).transfer(item.price);

        //Create order
        Order memory order = Order(block.timestamp, item);

        //save order
        orders[msg.sender][_id] = order;

    }

}