import { ethers } from 'ethers'
import React from 'react'
import { useEffect, useState } from 'react'

const Section = ({account, items, togglePop, togglePop2}) => {
    const itemsF = items
    const [items2, setItems2] = useState(null);

    //filter prices
    const [price, setPrice] = useState(0.0000);
    const handlePriceChange = (event) => {
        const inputValue = parseFloat(event.target.value);
        if (!isNaN(inputValue)) {
            setPrice(inputValue);
        }
    };

    const [price2, setPrice2] = useState(0.0000);
    const handlePrice2Change = (event) => {
        const inputValue = parseFloat(event.target.value);
        if (!isNaN(inputValue)) {
            setPrice2(inputValue);
        }
    };

    //filter category
    const [selectedCategories, setSelectedCategories] = useState(["category 1","category 2","category 3","category 4","category 5","category 6","category 7","sample"]);
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

    useEffect(() => {
        setItems2(itemsF);
      }, [itemsF]);

    //search
    const [inputSearch, setInputSearch] = useState('');

    const searchChange = async (event) => {
        setInputSearch(event.target.value);
    };
    const handleSubmit = async (event) => {
        event.preventDefault(); 

        //get each word in the searched words
        const searchTerms = inputSearch.split(/[,\s]+/).map((term) => term.split(/\s+/)).flat();

        //filter items to search
        const filteredItems = await Promise.all(
            itemsF.map(async (item) => {
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
                                    <button class="filter-button" data-category="category 1" onClick={() => toggleCategory("category 1")}>Category 1</button>
                                    <button class="filter-button" data-category="category 2" onClick={() => toggleCategory("category 2")}>Category 2</button>
                                    <button class="filter-button" data-category="category 3" onClick={() => toggleCategory("category 3")}>Category 3</button>
                                    <button class="filter-button" data-category="category 4" onClick={() => toggleCategory("category 4")}>Category 4</button>
                                    <button class="filter-button" data-category="category 5" onClick={() => toggleCategory("category 5")}>Category 5</button>
                                    <button class="filter-button" data-category="category 6" onClick={() => toggleCategory("category 6")}>Category 6</button>
                                    <button class="filter-button" data-category="category 7" onClick={() => toggleCategory("category 7")}>Category 7</button>
                                    <button class="filter-button" data-category="sample" onClick={() => toggleCategory("sample")}>Sample</button>
                                </div>
                            </div>
                        </div>
                        <div class="filter-containerText">
                            <button class="apply-button" onClick={handleSubmit}>Apply</button>
                        </div>
                    </div>
                    {account ? (
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
                                <div class="profile-button">
                                    Account
                                </div>
                                <div class="profile-button" onClick={togglePop2}>
                                    Create a Listing
                                </div>
                                <div class="profile-button">
                                    Active Listings
                                </div>
                            </div>
                        </div>
                    ):(
                        <p></p>
                    )}
                    {items2 ? (
                        <div class="grid-container">
                            {items2.map((item, i) => (
                                <>
                                <li class="listing-container" key={i} onClick={() => togglePop(item)}>
                                    <div class="item-image2" id="item-image2">
                                        <img src={item.image} alt="ItemImage"></img>
                                    </div>
                                    <a class="listing-links">
                                        <a class="listing-links2">
                                            <p>{item.name}</p>
                                            <div class="listing-price-container">{ethers.utils.formatUnits(item.price.toString(),'ether')} ETH</div>
                                        </a>
                                    </a>
                                </li>
                                </>
                            ))}
                        </div>
                    ):(
                        <div class="grid-container">
                        </div>
                    )}
                    

                </div>
            </div>
        </div>
    </div>
    );
}

export default Section;