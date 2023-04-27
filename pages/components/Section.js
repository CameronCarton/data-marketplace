import { ethers } from 'ethers'
import React from 'react'
import { useEffect, useState } from 'react'
import Papa from 'papaparse';
import { create } from 'ipfs-http-client'


const Section = ({account, provider, items, dataMarket, togglePop, togglePop2, toggle, toggle2, setAccount}) => {


    const [items2, setItems2] = useState(null);
    const [itemsExtra, setItemsExtra] = useState(null);
    const [price, setPrice] = useState(0.0000);
    const [price2, setPrice2] = useState(0.0000);
    const [selectedCategories, setSelectedCategories] = useState(["Demographic","Financial","Geographic","Consumer behavior","Environmental","Social media","Medical","Other"]);
    const [inputSearch, setInputSearch] = useState('');
    const [itemsWithOrders, setItemsWithOrders] = useState([]);
    const [allOrders, setAllOrders] = useState([]);
    const [ordersPage, setOrdersPage] = useState(false);
    const [startOrderPage, setStartOrderPage] = useState(false);
    const [order, setOrder] = useState(false);
    const [pageHeader, setPageHeader] = useState("Marketplace");
    const [page, setPage] = useState(0);
    const [maxPage, setMaxPage] = useState(false);


    //ipfs
    const projectId = "2M3RsTdrt2xMd2SUInpHJf7JDlh";
    const projectSecret = "37549890a23ea362509f8517bf1bc14c";
    const authorization = "Basic " + btoa(projectId + ":" + projectSecret);
    const ipfs = create({
      url: "https://ipfs.infura.io:5001/api/v0",
      headers:{
        authorization
      }
    })



    //ipfs upload
    const uploadFileToIPFS = async (file, type) => {

      //upload
      console.log("Beginning Upload to IPFS...")
      const fileLink = await ipfs.add(file);

      //image files
      if(type==1)
      return "https://ipfs.io/ipfs/"+fileLink.path;

      //data files
      if(type==2)
      return fileLink.path;
    };



    //connects Ethereum Wallet from MetaMask
    const connectWallet = async () => {
        const accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
        const account = ethers.utils.getAddress(accounts[0]);
        setAccount(account);
        console.log("CONNECTED ETHEREUM WALLET!")
    }



    //filter prices
    const handlePriceChange = (event) => {
        const inputValue = parseFloat(event.target.value);
        if (!isNaN(inputValue)) {
            setPrice(inputValue);
        }
    };
    const handlePrice2Change = (event) => {
        const inputValue = parseFloat(event.target.value);
        if (!isNaN(inputValue)) {
            setPrice2(inputValue);
        }
    };



    //filter category
    const toggleCategory = async (category) => {
        if (selectedCategories.includes(category)) {
            await setSelectedCategories(selectedCategories.filter((c) => c !== category));
        } else {
            await setSelectedCategories([...selectedCategories, category]);
        }
    };



    useEffect(() => {
        // Add or remove selected class from button
        const buttons = document.querySelectorAll('.filter-button');
        buttons.forEach((button) => {
            const buttonCategory = button.dataset.category;
            if (selectedCategories.includes(buttonCategory)) {
                button.classList.add('selected');
            } else {
                button.classList.remove('selected');
            }
        });
    }, [selectedCategories]);



    //loads the items in sets of 12
    const itemsPerPageLoad = async (items) =>{
        const itemsPerPage = 12;
        const items_ = [];

        if(itemsPerPage+(page*itemsPerPage) >= items.length){
            for (var i=items.length-itemsPerPage+(itemsPerPage-(items.length%itemsPerPage)); i<items.length; i++){
                const item = items[i];
                items_.push(item);
            }
            setMaxPage(true);
        }else{
            for (var i=(page*itemsPerPage); i<itemsPerPage+(page*itemsPerPage); i++){
                const item = items[i];
                items_.push(item);
            }
            setMaxPage(false);
        }
        
        setItems2(items_);
    }


    //updates Items
    useEffect(() => {
        if(items!=null)itemsPerPageLoad(items);
        window.scrollTo(0, 0);
        if(!account){
            connectWallet();
        }
    }, [items,page]);


    //Creates grey "filler" item contrainers in the item grid
    useEffect(() => {
        if(items2!=null){
        const items2Len = items2.length;
        const extraLen = 12 - items2Len % 12;
        if(extraLen==12)extraLen=0;
        const itemExtra = Array(extraLen).fill(0);
        
        setItemsExtra(itemExtra);
        }
    }, [items2]);



    //Searching for items
    const searchChange = async (event) => {
        setInputSearch(event.target.value);
    };


    //Submitting Search entry
    const handleSubmit = async (event) => {
        event.preventDefault(); 
        setPageHeader("Results for... " + inputSearch);

        //get each word in the searched words
        const searchTerms = inputSearch.split(/[,\s]+/).map((term) => term.split(/\s+/)).flat();

        //filter items to search
        const filteredItems = await Promise.all(
            items.map(async (item) => {

            //splits tags and compares for search
            const tags = item.tags.toLowerCase().split(',');
            const containsSearchTerms = searchTerms.some((term) => tags.some((tag) => tag.includes(term)));
            const containsCategory = selectedCategories.includes(item.category);
            const priceRange = ethers.utils.formatUnits(item.price.toString());
            if ((!inputSearch || containsSearchTerms) && containsCategory && (priceRange >= price || price==0) && (priceRange <= price2 || price2==0)) {
                return item;
            }
            })
        );
        itemsPerPageLoad(filteredItems.filter(Boolean));
        setItemsWithOrders([]);
    };



    //Submitting Search entry
    const MarketplaceReset = async () => {
        window.scrollTo(0, 0);
        setPage(0);
        itemsPerPageLoad(items);
        setOrdersPage(false);
        setPrice(0.0000);
        setPrice2(0.0000);
        setSelectedCategories(["Demographic","Financial","Geographic","Consumer behavior","Environmental","Social media","Medical","Other"]);
        setPageHeader("Marketplace");
        setItemsWithOrders([]);
    };



    //filter to your listings only
    const yourListings = async () => {

        setOrdersPage(false);
        window.scrollTo(0, 0);
        setPage(0);
        setPageHeader("Your Listings");

        setPrice(0.0000);
        setPrice2(0.0000);
        setSelectedCategories(["Demographic","Financial","Geographic","Consumer behavior","Environmental","Social media","Medical","Other"]);

        //filter items to if you are the owner
        const items2 = [];
        await Promise.all(
            items.map(async (item) => {
                const owner = await item.owner;

                //item owner to match your account address
                if(owner.toString() == account.toString()){
                    items2.push(item);
                }
            })
        );
        itemsPerPageLoad(items2);
    };



    //filter to your purchases only
    const yourPurchases = async () => {

        setOrdersPage(false);
        window.scrollTo(0, 0);
        setPageHeader("Your Purchases");

        setPrice(0.0000);
        setPrice2(0.0000);
        setPage(0);
        setSelectedCategories(["Demographic","Financial","Geographic","Consumer behavior","Environmental","Social media","Medical","Other"]);

        //filter items to if you have an order
        const items2 = [];
        const itemsWithOrders = [];
        await Promise.all(
            items.map(async (item) => {

                //get all items you have ordered
                const completed = await dataMarket.ordersFulfilled(item.id, account);

                //Order completed is 1 if the order exists and is 2 if fulfilled
                if(completed.toString() == "1" || completed.toString() == "2"){
                   if(completed.toString() == "2"){
                       itemsWithOrders.push(false);
                   }
                   if(completed.toString() == "1"){
                       itemsWithOrders.push(true);
                   }
                   items2.push(item);
               }
            })
        );
        itemsPerPageLoad(items2);
        setItemsWithOrders(itemsWithOrders);
        console.log(itemsWithOrders);
    };



    //When Seller Accepts Order
    const acceptOrder = async (buyer) => {

        //Retrieve Input Data File (to send to buyer)
        const fileSelector2 = document.getElementById('file-selector2');
        const file2 = fileSelector2.files[0];
        const reader = new FileReader();
        
    
        //Reading in File and Completing Sale
        reader.addEventListener('load', async (event) => {
  
            //Converting file to JSON
            const csv = Papa.parse(event.target.result, { header: true });
            const dataFile = JSON.stringify(csv);
    
    
    
            // Diffie Hellman Key Exchange
            const crypto = require('crypto');
    
            //Getting Prime and Generator from modp15
            const seller_key = crypto.getDiffieHellman('modp15');
            seller_key.generateKeys();
            const gs_key = seller_key.getPublicKey('hex');
            
            //Retrieving Buyer Public key stored in Order
            const gb = order.gb;
    
            //Creating the main Secret Key (Symmetric Key for Encrypting and Decrypting)
            const secretKey = seller_key.computeSecret(Buffer.from(gb, 'hex'),null,'hex');
    
            //Decodes SecretKey from a Uint8Array to Hexadecimal
            const secretDecode = new TextDecoder('utf8').decode(secretKey);
    
  
  
            //Encrypting Data with AES (using Secret Key)
            var AES = require("crypto-js/aes");
            const data = AES.encrypt(
                dataFile,
                secretDecode);
    
                
    
            //Uploading Encrypted Data to IPFS
            const dataLink = await uploadFileToIPFS(data.toString(),2)
            console.log("Data File uploaded at: https://ipfs.io/ipfs/" + dataLink);
    
    
            //Completing transaction with Smart Contract
            const buyerAddress = ethers.utils.getAddress(buyer);
            const dataLocation = dataLink;
            const itemID = parseInt((order.item).id);
    
            //Seller public key (gs_key) is stored in Smart Contract
            const signer = await provider.getSigner();
            let transaction = dataMarket.connect(signer).setOrderComplete(buyerAddress, 
                                                                            order.id,
                                                                            itemID, 
                                                                            gs_key, 
                                                                            dataLocation);
            await transaction;
            startOrder(false, account);
        });
  
        //reads in file
        reader.readAsText(await file2);
    }



    // Getting all orders for an account
    const ordersPageStart = async (bool) => {
        window.scrollTo(0, 0);

        //not very efficient code but it will work on a small scale application
        //get all orders
        const allOrders = [];
        const allUserOrders = await dataMarket.userOrders(account);


        for(let i=1; i <= allUserOrders; i++){
            //getting all orders for items that match the account       
            const order = await dataMarket.orders(account, i);

            if((order.complete).toString() == "1" || (order.complete).toString() == "2"){
                allOrders.push(order);
            }
            
        }

        setAllOrders(allOrders);
        setOrdersPage(bool);
    }



    //Start Order Menu
    const startOrder = (bool, order) => {
        window.scrollTo(0, 0);
        setOrder(order);
        setStartOrderPage(bool);
    }



    //move item pages
    const setPageValue = (val) => {
        if(val<0)val=0;
        if(maxPage && val > page)val=page;
        setPage(val);
    }



    //Disconnect Wallet
    const disconnectWallet = () => {
        setAccount(null);
        console.log("DISCONNECTED ETHEREUM WALLET!")
    }



    return(

        <div class="services">

            <div class="services-container">

                <div class="services-visualTop">

                    <h1>Discover the right Data for your needs</h1>


                    <div class="marketplace-container">
                    
                        {(toggle || toggle2 || startOrderPage) ?(
                            <></>
                        ):(
                            <nav class="navbar">
                                <div class="navbar-container">
                                    <a id="navbar-logo"> </a>

                                    <ul class="navbar-menu">

                                        <li class="navbar-item">
                                            <a class="navbar-links" onClick={MarketplaceReset} >Marketplace</a>
                                        </li>

                                        {account ? (
                                            <>
                                                <li class="navbar-item">
                                                    <a class="navbar-links" onClick={yourPurchases}>Your Purchases</a>
                                                </li>

                                                <li class="navbar-item">
                                                    <a class="navbar-links" onClick={yourListings}>Your Listings</a>
                                                </li>

                                            </>
                                        ):(
                                            <div id="wallet-container">
                                                <button id="connect-wallet-button" onClick={connectWallet}>Connect Wallet</button>
                                                <div id="message-container"></div>
                                            </div>
                                        )}
                                        
                                    </ul>
                                </div>
                            </nav>
                        )}
                        

                        {!ordersPage &&(
                            <div class="filter-container">


                                <div class="filter-containerText">
                                    <p>Filters</p>
                                </div>


                                <div class="filter-container2">

                                    <div class="filter-container3">
                                        Min Price
                                        <input
                                            class="item-text-box-price2"
                                            type="number"
                                            step="0.0001"
                                            min="0.0001"
                                            value={price}
                                            onChange={handlePriceChange}
                                        />
                                    </div>

                                    <div class="filter-container3">
                                        Max Price
                                        <input
                                            class="item-text-box-price2"
                                            type="number"
                                            step="0.0001"
                                            min="0.0001"
                                            value={price2}
                                            onChange={handlePrice2Change}
                                        />
                                    </div>

                                </div>


                                <div class="filter-container2">
                                    
                                    <div class="filter-container4">
                                        Categories
                                        <div class="filter-container5">
                                            <button class="filter-button" data-category="Demographic" onClick={() => toggleCategory("Demographic")}>Demographic</button>
                                            <button class="filter-button" data-category="Financial" onClick={() => toggleCategory("Financial")}>Financial</button>
                                            <button class="filter-button" data-category="Geographic" onClick={() => toggleCategory("Geographic")}>Geographic</button>
                                            <button class="filter-button" data-category="Consumer behavior" onClick={() => toggleCategory("Consumer behavior")}>Consumer</button>
                                            <button class="filter-button" data-category="Environmental" onClick={() => toggleCategory("Environmental")}>Environmental</button>
                                            <button class="filter-button" data-category="Social media" onClick={() => toggleCategory("Social media")}>Social media</button>
                                            <button class="filter-button" data-category="Medical" onClick={() => toggleCategory("Medical")}>Medical</button>
                                            <button class="filter-button" data-category="Other" onClick={() => toggleCategory("Other")}>Other</button>
                                        </div>
                                    </div>

                                </div>


                                <div class="filter-containerText">
                                    <button class="apply-button" onClick={handleSubmit}>Apply</button>
                                </div>


                            </div>
                        )}


                        {account &&(
                            <div class="profile-container">
                                <div class="profile-containerImage">
                                    <div class="profile-image" id="profile-image">
                                        <img src="https://ipfs.io/ipfs/QmZYW9Gh5Yz7wj15yqU9y9WhaWn9C7hMPsvQ1Xovk4hBVH" alt="Profile"></img>
                                    </div> 
                                </div>
                                <div class="profile-container2">
                                    <div class="profile-id-display">
                                    {account.slice(0,6) + '...' + account.slice(38,42)}
                                    </div>

                                    <div class="profile-button" onClick={togglePop2}>
                                        Create a Listing
                                    </div>

                                    <div class="profile-button" onClick={() => ordersPageStart(true)}>
                                        Orders Received
                                    </div>

                                    <div class="profile-button" onClick={disconnectWallet}>
                                        Disconnect Wallet
                                    </div>
                                </div>
                            </div>
                        )}


                        {!ordersPage && !toggle && !toggle2 && !startOrderPage ?(
                            <>
                                <div class="search-position-container">
                                    <div class="search-container">

                                        <form onSubmit={handleSubmit}>
                                            <input
                                            type="text"
                                            placeholder="Search..."
                                            value={inputSearch}
                                            onChange={searchChange}
                                            />
                                            <button type="submit"><i></i></button>
                                        </form>

                                    </div> 
                                </div>
                                 
                                <div class="search-position-container" style={{top:"0px",height:"40px","text-align":"left",padding: "0px 0px 0px 0px", "padding-left":"40px"}}>
                                    <u>{pageHeader}</u>
                                </div>

                                <div class="grid-container">
                                    {items2 &&(
                                        <>
                                            {items2.map((item, i) => (
                                                <>
                                                <li class="listing-container" key={i} onClick={() => togglePop(item)}>
                                                    <div class="item-image2" id="item-image2">
                                                        <img src={item.image} alt="ItemImage"></img>
                                                    </div>
                                                    <a class="listing-links">

                                                        {itemsWithOrders[i] && account != item.owner &&(
                                                            <>
                                                                <strong class="listing-price-container">Order Placed</strong>
                                                            </>
                                                        )}

                                                        <a class="listing-links2">
                                                            <strong>{item.name}</strong>
                                                            <p>{item.category}</p>
                                                            {account != null && item.owner == account.toString() ?(
                                                                <>
                                                                    <strong class="listing2-price-container">Listed by You</strong>
                                                                </>
                                                            ):(
                                                                <>
                                                                <strong class="listing-price-container">{ethers.utils.formatUnits(item.price.toString(),'ether')} ETH</strong>
                                                                </>
                                                            )}
                                                        </a>
                                                        
                                                        {item.stars >= 1 && item.stars < 1.5 &&(<div class= "stars-container">{"    *"}</div>)}
                                                        {item.stars >= 1.5 && item.stars < 2.5 &&(<div class= "stars-container">{"   **"}</div>)}
                                                        {item.stars >= 2.5 && item.stars < 3.5 &&(<div class= "stars-container">{"  ***"}</div>)}
                                                        {item.stars >= 3.5 && item.stars < 4.5 &&(<div class= "stars-container">{" ****"}</div>)}
                                                        {item.stars >= 4.5 && item.stars <= 5 &&(<div class= "stars-container">{"*****"}</div>)}
                                                    </a>
                                                </li>
                                                </>
                                            ))}
                                        </>
                                    )}

                                    
                                    {itemsExtra &&(
                                        <>
                                        {itemsExtra.map((item, i) => (
                                            <>
                                            <div key={i} class="listing-container" style={{background: '#E2E2E2'}}></div>
                                            </>
                                        ))}
                                        </>
                                    )}
                            
                            
                                </div>

                                <div class="search-position-container" style={{top:"0px",height:"80px",padding: "0px 0px 0px 0px", "padding-left": "18.5%",
                                                                                display: "flex", "flex-wrap": "wrap", "flex-direction": 
                                                                                "row","justify-content" : "left"}}>

                                    { page > 0 ?(
                                        <div class="profile-button" onClick={() => setPageValue(page-1)} style={{border: "0px","max-width": "20%", "max-height": "40px","padding-left": "0px","z-index":"20"}}>
                                                {(page+1-1).toString() + "  < Previous Page"}
                                        </div>
                                    ):(
                                        <div class="profile3-button" onClick={() => setPageValue(page-1)} style={{border: "0px","max-width": "20%", "max-height": "40px","padding-left": "0px","z-index":"20"}}>
                                                {(page+1-1).toString() + "  < Previous Page"}
                                        </div>
                                    )}
                                    
                                    <div class="listing-links2" style={{"text-align":"center", height: "100%", width:"5%", position:"relative",margin:"5px","padding-left":"120px", background: "rgba(0,0,0,0)","z-index":"10"}}>
                                        <p>{(page+1).toString()}</p>
                                    </div>

                                    { maxPage == false ?(
                                        <div class="profile-button" onClick={() => setPageValue(page+1)} style={{border: "0px","max-width": "20%", "max-height": "40px","padding-left": "0px",left:"20px","z-index":"20"}}>
                                            {"Next Page >  " + (page+1+1).toString()}
                                        </div>
                                    ):(
                                        <div class="profile3-button" onClick={() => setPageValue(page+1)} style={{border: "0px","max-width": "20%", "max-height": "40px","padding-left": "0px",left:"20px","z-index":"20"}}>
                                            {"Next Page >  " + (page+1+1).toString()}
                                        </div>
                                    )}
                                </div>
                            </>
                        ):(

                            <>
                                <div class="search-position-container" style={{top:"0px",height:"100px","text-align":"left",top:"2vh",padding: "40px 0px 0px 0px", "padding-left":"40px"}}>
                                    <u>Orders</u>
                                </div>


                                <div class="order-container">
                                    {allOrders &&(
                                        <>
                                            {allOrders.map((order, i) => (
                                            <>
                                                <div class="order-button" key={i} onClick={() => startOrder(true, order)}>
                                                
                                                    <p>Order for : 
                                                        <strong>{((order.item).name).toString()}</strong>
                                                    </p>
                                                    <p>Ordered : 
                                                            {new Date(Number(order.time.toString() + '000')).toLocaleDateString(
                                                                undefined,
                                                                {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric',
                                                                hour: 'numeric',
                                                                minute: 'numeric',
                                                                second: 'numeric',
                                                                hour12: false
                                                                }
                                                            )}
                                                    </p>
                                                    <p>Order Placed by: 
                                                        {(order.buyer).toString()}
                                                    </p>
                                                    {(order.complete).toString() == "1" ?(
                                                        <>
                                                            <strong class="order-status-container" style={{background:"#006AFF", color:"#FFFFFF", border: "2px solid #006AFF"}}>UNCOMPLETED</strong>
                                                        </>
                                                    ):(
                                                        <>
                                                            <strong class="order-status-container" >COMPLETED</strong>
                                                        </>
                                                    )}
                                                    
                                                </div>
                                            </>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </>
                        )}

                    </div>
                </div>
            </div>

            {startOrderPage &&(
                <div class="itemPage">
                    <div class="item-details" style={{ "max-width":"800px", height: "20%", 
                                              top: "200px", "text-align":"center","justify-Content":"center",
                                              "font-size":"1.5rem","padding-top":"100px"}}>

                    <p>Complete Sale of</p>

                    <strong>{((order.item).name).toString()}</strong>

                    <div class="item-text-box2-files" style={{"left":"25%","text-align":"center","justify-Content":"center"}}>
                        
                        Select Data to Send-

                        <input type="file" id="file-selector2" accept="text/*" />
                        <label htmlFor="file-selector" class="button"></label>

                    </div>

                        
                    <button class="profile-button" onClick={() => acceptOrder(order.buyer)} style={{"max-width":"80%", left:"0%"}}>Complete Order</button>
                    <button class="profile-button" onClick={() => startOrder(false, account)} style={{"max-width":"80%", left:"0%"}}>Return to Product page</button>

                    </div>
                </div>
            )}

        </div>
    );
}

export default Section;