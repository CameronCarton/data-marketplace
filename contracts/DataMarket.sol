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
        address buyer;
        uint256 id;
        uint256 time;
        Item item;
        uint256 complete;
        string gb;
        string gs;
        string data;
    }
    
    mapping(uint256 => Item)public items;
    mapping(address => mapping(uint256 => Order)) public orders;
    mapping(address => uint256)public userOrders;

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

    }

    //setting Order variables
    function setOrderComplete(
            address _owner, 
            address _buyer, 
            uint256 _id, 
            uint256 _complete, 
            string memory _gs, 
            string memory _data) public {

        //Fetch item
        Item memory item = items[_id];

        //get order that matches
        uint256 len = userOrders[address(item.owner)];

        for (uint256 i = 0; i <= len; i++) {
            Order storage order = orders[_owner][i];
            Item memory orderItem = order.item;

            if(order.buyer == _buyer && orderItem.id == _id){
                uint256 id = order.id;

                orders[_owner][id].complete = _complete;
                orders[_owner][id].gs = _gs;
                orders[_owner][id].data = _data;

                break;
            }
        }
    }

}