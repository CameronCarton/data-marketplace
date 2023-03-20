import { ethers } from 'ethers'
import { useEffect, useState } from 'react'

const ItemPage = ({item, provider, account, dataMarket, togglePop}) => {

    const buyItem = async () => {
        const signer = await provider.getSigner()

        let transaction = dataMarket.connect(signer).buy(item.id, {value: item.price})
        await transaction.wait()

        console.log("buying item")
    }

    return(
    <div class="itemPage">
        <div class="item-details">
            <button class="close" onClick={togglePop}>x</button>
            <div class="item-details2">
                <div class="item-overview">
                    
                    <div class="item-image" id="item-image">
                        <img src={item.image} alt="Item"></img>
                    </div>
                    <div class="item-overview2">
                        {item.name}
                        <p>{ethers.utils.formatUnits(item.price.toString(), 'ether')} ETH</p>
                        <p>{item.category}</p>
                    </div>
                    <div class="item-overview3">
                        Item Information
                        <p>{item.information}</p>
                    </div>
                </div>
                <div class="item-order">
                    <div class="item-order2">
                        {ethers.utils.formatUnits(item.price.toString(), 'ether')} ETH
                    </div>
                    <button class="item-buy" onClick={buyItem}>Buy Now</button>
                </div>
            </div>
        </div>
    </div>

    );
}

export default ItemPage;