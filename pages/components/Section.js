import { ethers } from 'ethers'
import React from 'react'

const Section = ({items, togglePop, togglePop2}) => {
    const itemsF = items

    return(
        <div class="services">
        <div class="services-container">
            <div class="services-visualTop">
                <h1>Discover the right Data for your needs</h1>
                <div class="search-container">
                    <form>
                        <input type="text" placeholder="Search..."></input>
                      <button type="submit"><i class="fa fa-search"></i></button>
                    </form>
                </div>
                <div class="marketplace-container">
                    <div class="filter-container">

                    </div>
                    <div class="profile-container">
                        <button class="item-buy" onClick={togglePop2}>Create a Listing</button>
                    </div>

                    {itemsF ? (
                        <div class="grid-container">
                            {items.map((item, i) => (
                                <>
                                <li class="listing-container" key={i} onClick={() => togglePop(item)}>
                                    <div class="item-image2" id="item-image2">
                                        <img src={item.image} alt="ItemImage"></img>
                                    </div>
                                    <a class="listing-links">
                                        {item.name}
                                        <p>{ethers.utils.formatUnits(item.price.toString(),'ether')} ETH</p>
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