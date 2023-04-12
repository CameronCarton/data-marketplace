// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

contract DataMarket{
    address public owner;

    modifier mustBeOwner(){
        require(msg.sender == owner);
        _;
    }

    constructor(){
        owner = msg.sender;
    }

    struct Item {
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
        uint _id,
        string memory _name,
        string memory _image,
        string memory _category,
        uint256 _price,
        string memory _information,
        string memory _tags,
        string memory _data,
        string memory _dataSample
    ) public mustBeOwner{
        //create Item
        Item memory item = Item(_id,_name,_image,_category,_price,_information,_tags,_data,_dataSample);

        //save Item
        items[_id] = item;
    }

    //Buying
    function buy(uint256 _id) public payable{
        //Fetch item
        Item memory item = items[_id];

        //ensure enough ether is sent to buy product
        require(msg.value >= item.price);

        //Create order
        Order memory order = Order(block.timestamp, item);

        //save order
        orders[msg.sender][_id] = order;

    }

    //withdraw funds
    function withdraw() public mustBeOwner{
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success);
    }
}