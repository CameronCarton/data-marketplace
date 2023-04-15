import { ethers } from 'ethers'
import React from 'react'
import { useEffect, useState } from 'react'



const Section = ({account, items, dataMarket, togglePop, togglePop2}) => {


    const itemsF = items
    const [items2, setItems2] = useState(null);
    const [itemsExtra, setItemsExtra] = useState(null);
    const [price, setPrice] = useState(0.0000);
    const [price2, setPrice2] = useState(0.0000);
    const [selectedCategories, setSelectedCategories] = useState(["Demographic","Financial","Geographic","Consumer behavior","Environmental","Social media","Medical","Other"]);
    const [inputSearch, setInputSearch] = useState('');


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



    //updates Items
    useEffect(() => {
        setItems2(itemsF);
    }, [itemsF]);


    //Creates grey "filler" item contrainers in the item grid
    useEffect(() => {
        if(items2!=null){
        const items2Len = items2.length;
        const extraLen = 4 - items2Len % 4;
        const itemExtra = Array(extraLen).fill(0);
        
        setItemsExtra(itemExtra);
        console.log(itemExtra);
        }
    }, [items2]);



    //Searching for items
    const searchChange = async (event) => {
        setInputSearch(event.target.value);
    };


    //Submitting Search entry
    const handleSubmit = async (event) => {
        event.preventDefault(); 

        //get each word in the searched words
        const searchTerms = inputSearch.split(/[,\s]+/).map((term) => term.split(/\s+/)).flat();

        //filter items to search
        const filteredItems = await Promise.all(
            itemsF.map(async (item) => {

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
        setItems2(filteredItems.filter(Boolean));
    };



    //filter to your listings only
    const yourListings = async () => {
        //filter items to only matching your address
        const filteredItems = await Promise.all(
            itemsF.map(async (item) => {
                const owner = await item.owner;

                //item owner to match your account address
                if(owner.toString() == account.toString()){
                    return item;
                }
            })
        );
        setItems2(filteredItems.filter(Boolean));
    };



    //filter to your purchases only
    const yourPurchases = async () => {
        //filter items to if you have an order
        const filteredItems = await Promise.all(
            itemsF.map(async (item) => {
                const order = await dataMarket.orders(account,item.id);

                //checking if the order is set or not
                if(order.toString()!="0,0x0000000000000000000000000000000000000000,0,,,,0,,,,"){
                    return item;
                }
            })
        );
        setItems2(filteredItems.filter(Boolean));
    };



    return(

        <div class="services">

            <div class="services-container">

                <div class="services-visualTop">

                    <h1>Discover the right Data for your needs</h1>
                    <div class="search-container">

                        <form onSubmit={handleSubmit}>
                            <input
                            type="text"
                            placeholder="Search..."
                            value={inputSearch}
                            onChange={searchChange}
                            />
                            <button type="submit"><i class="fa fa-search"></i></button>
                        </form>

                    </div>


                    <div class="marketplace-container">
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
                                <div class="profile-button" onClick={yourListings}>
                                    Your Listings
                                </div>
                                <div class="profile-button" onClick={yourPurchases}>
                                    Your Purchases
                                </div>
                                <div class="profile-button" onClick={handleSubmit}>
                                    All Listings
                                </div>
                            </div>
                        </div>
                        )}


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
                                                <a class="listing-links2">
                                                <strong>{item.name}</strong>
                                                {account != null && item.owner == account.toString() ?(
                                                    <>
                                                        <strong class="listing-price-container">Listed by You</strong>
                                                    </>
                                                ):(
                                                    <>
                                                    <strong class="listing-price-container">{ethers.utils.formatUnits(item.price.toString(),'ether')} ETH</strong>
                                                    </>
                                                )}
                                                </a>
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

                    </div>
                </div>
            </div>
        </div>
    );
}

export default Section;