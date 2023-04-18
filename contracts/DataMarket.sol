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
        uint256 id;
        string name;
        string image;
        string category;
        uint256 price;
        string information;
        string tags;
        string dataSample;
        uint256 stars;
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

    struct Review {
        address buyer;
        uint256 id;
        uint256 stars;
        string text;
    }

    modifier onlyOwner(uint256 _id) {
        require(items[_id].owner == msg.sender, "Account is not the owner of this item.");
        _;
    }

    modifier notOwner(uint256 _id) {
        require(items[_id].owner != msg.sender, "Account is the owner of this item.");
        _;
    }
    
    modifier orderExists(uint256 _order, address _buyer) {
        require(orders[msg.sender][_order].buyer == _buyer, "Order does Not Exist.");
        _;
    }

    modifier canPostReview(address owner,uint256 _order, address _buyer) {
        require(orders[owner][_order].buyer == _buyer, "Order does Not Exist.");
        _;
    }

    modifier starsValid(uint256 _stars) {
        require(_stars >= 1 && _stars <= 5, "Stars given are not valid.");
        _;
    }

    mapping(uint256 => Item)public items;

    mapping(address => mapping(uint256 => Order)) public orders;
    mapping(uint256 => mapping(address => uint256)) public ordersFulfilled;
    mapping(address => uint256)public userOrders;

    mapping(uint256 => uint256)public itemReviewAmount;
    mapping(uint256 => mapping(uint256 => Review)) public reviews;

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
        Item memory item = Item(_owner,itemId,_name,_image,_category,_price,_information,_tags,_dataSample,0);

        //save Item
        items[itemId] = item;

        //emit event
        emit ListItem(msg.sender, itemId, _name, _price);

        //increment itemId
        itemId += 1;
    }



    function deleteItem(
        uint256 _itemId
    ) public onlyOwner(_itemId){
        //create Empty Item
        Item memory item = Item(items[_itemId].owner,0,"","","",0,"","","",0);

        //overwrite Item in position
        items[_itemId] = item;

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



    //Post Review
    function postReview(
        uint256 _id, 
        uint256 _order,
        uint256 _stars,
        string memory _text
    ) public notOwner(_id) canPostReview(items[_id].owner,_order,msg.sender) starsValid(_stars){

        //increment amount of reviews for item
        uint256 newReviewAmount = itemReviewAmount[_id] + 1;
        itemReviewAmount[_id] = newReviewAmount;


        //create Review
        Review memory review = Review(msg.sender,_id,_stars,_text);

        //save Review
        reviews[_id][newReviewAmount] = review;


        //combine stars for item rating
        uint256 newStarRating = 0;
        for(uint256 i=1; i<=newReviewAmount; i++){
            newStarRating += reviews[_id][i].stars;
        }

        //average of all review scores
        items[_id].stars = (newStarRating/newReviewAmount);
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