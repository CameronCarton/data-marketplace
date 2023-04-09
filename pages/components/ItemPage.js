import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { create } from 'ipfs-http-client'
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

const ItemPage = ({item, provider, account, dataMarket, togglePop}) => {

    //ipfs
    const projectId = "2M3RsTdrt2xMd2SUInpHJf7JDlh";
    const projectSecret = "37549890a23ea362509f8517bf1bc14c";
    const authorization = "Basic " + btoa(projectId + ":" + projectSecret);
    const ipfs = create({
        host: 'ipfs.infura.io', port: 5001, protocol: 'https',
        headers:{
          authorization
        }
      })
    const buyItem = async () => {
        const signer = await provider.getSigner();

        let transaction = dataMarket.connect(signer).buy(item.id, {value: item.price});
        await transaction.wait();

        console.log("buying item");
    }

    //download file from ipfs
    async function downloadFile(){

        fetch("https://ipfs.io/ipfs/" + (item.data).toString())
        .then(response => response.text())
        .then(async (data) => {
            //test key
            const secretKey = "9f8a7e6d5c4b3a291e0f1d2c3b4a5b6c7d8e9f0a1b2c3d4e5f6g7h8i9j0k1l2m3";

            // Decrypt the string
            var AES = require("crypto-js/aes");
            var enc = require("crypto-js/enc-utf8");
            const bytes = AES.decrypt(data.toString(), secretKey);
    
            //convert back to json data
            const parsedData = JSON.parse(bytes.toString(enc));
            console.log(parsedData);

            //download file
            downloadCSV(parsedData.data);
            }).catch((err) => {
            console.error(err);
            });
      };

      const convertToCSV = (data) => {
        const keys = Object.keys(data);
        const header = Object.keys(data[keys[0]]);
        
        const csvRows = [header.join(",")];
      
        for (const key of keys) {
          const row = Object.values(data[key]);
          csvRows.push(row.join(","));
        }
      
        return csvRows.join("\n");
      };
      
      const downloadCSV = (data) => {
        const csv = convertToCSV(data);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, "data.csv");
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
                <button class="item-buy" onClick={buyItem}>Buy Now</button>
                <button class="item-buy" onClick={downloadFile}>Download</button>
            </div>

        </div>


    </div>

    

    );
}

export default ItemPage;