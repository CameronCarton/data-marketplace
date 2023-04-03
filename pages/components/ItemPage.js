import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { create } from 'ipfs-http-client'

const ItemPage = ({item, provider, account, dataMarket, togglePop}) => {


    const buyItem = async () => {
        const signer = await provider.getSigner();

        let transaction = dataMarket.connect(signer).buy(item.id, {value: item.price});
        await transaction.wait();

        console.log("buying item");
    }

    //const decryptData = () => {
    //    var AES = require("crypto-js/aes");
    //    var enc = require("crypto-js/enc");
    //    const bytes = AES.decrypt(text, secretPass);
    //    const data = JSON.parse(bytes.toString(enc.Utf8));
    //    setDecrptedData(data);
    //  };

    //download file from ipfs
    //just opens file right now
    async function downloadFile(){
            window.open(item.data, '_blank');
      };

    return(
        <div class="itemPage">
        <div class="item-details">
            <button class="close" onClick={togglePop}>x</button>
            <div class="item-details2">

                <div class="item-image" id="item-image">
                    <img src={item.image} alt="Item"></img>
                </div> 

                <div class="item-overview2">

                    <div class="item-text-box2">
                        <p>Item Name : </p>
                        {item.name}
                    </div>

                    <div class="item-text-box2">
                        <p>Price : </p>
                        <p>{ethers.utils.formatUnits(item.price.toString(), 'ether')} ETH</p>
                    </div>

                    <div class="item-text-box2">
                        <p>Category : </p>
                        <p>{item.category}</p>
                    </div>

                </div>

            </div>

            <div class="item-text-box-files">
                
            </div>

            <div class="item-text-box-files">
                <div class="item-text-box2-info">
                        <p>Description : </p>
                        <p>{item.information}</p>
                </div>
            </div>

            <div class="item-text-box-files">
                <div class="item-text-box2-tags">
                        <p>Tags : </p>
                        <p>{item.tags}</p>
                </div>
            </div>

            <div class="item-order">
                <div class="item-order2">
                {ethers.utils.formatUnits(item.price.toString(), 'ether')} ETH
                </div>
                <button class="item-buy" onClick={downloadFile}>Buy Now</button>
            </div>

        </div>


    </div>

    

    );
}

export default ItemPage;