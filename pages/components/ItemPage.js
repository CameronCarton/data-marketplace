import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { create } from 'ipfs-http-client'
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

const ItemPage = ({item, provider, account, dataMarket, togglePop}) => {

    const [order,setOrder] = useState(null);
    const [hasBought,setHasBought] = useState(false);
    const [hasDownloaded,setHasDownloaded] = useState("Download");
    const [dataSample, setDataSample] = useState(null);
    const [columns, setColumns] = useState();
    const [data, setData] = useState();


    const fetchDetails = async () => {
        //get sample data
        console.log("retrieving dataSample from ipfs...");
        await fetch("https://ipfs.io/ipfs/" + (item.dataSample).toString())
        .then(response => response.text())
        .then(async (data) => {

            setDataSample(data);

            //display sample data
            const jsonData = Papa.unparse(data);
            const parsed = Papa.parse(jsonData)
            const data_ = parsed.data;
            const columns = Object.keys(parsed.data[0]);
            setData(data_);
            setColumns(columns);


            }).catch((err) => {
            console.error(err);
            });
        console.log("data retrieved!");

        const order = await dataMarket.orders(account,item.id);
        if(order.toString()=="0,0,,,,0,,,,")return;
        setOrder(order);

    }

    const buyItem = async () => {
        const signer = await provider.getSigner();

        let transaction = dataMarket.connect(signer).buy(item.id, {value: item.price});
        const trans = await transaction;

        console.log("buying item" + trans.toString());

        setHasBought(true);
    }

    //download file from ipfs
    async function downloadFile(){

            //get data
            setHasDownloaded("Fetching Data...");
            console.log("retrieving data from ipfs...");
            await fetch("https://ipfs.io/ipfs/" + (item.data).toString())
            .then(response => response.text())
            .then(async (data) => {

                const dataJSON = data;

                //test key
                const secretKey = "9f8a7e6d5c4b3a291e0f1d2c3b4a5b6c7d8e9f0a1b2c3d4e5f6g7h8i9j0k1l2m3";

                // Decrypt the string
                var AES = require("crypto-js/aes");
                var enc = require("crypto-js/enc-utf8");


                const dataToDecrypt = dataJSON.toString();
                const decryptedData = AES.decrypt(dataToDecrypt, secretKey);
        
                //convert back to json data
                const parsedData = JSON.parse(decryptedData.toString(enc));

                setHasDownloaded("Downloading");

                //download file
                downloadCSV(parsedData.data);

                }).catch((err) => {
                console.error(err);
                });
            console.log("data retrieved!");
            setHasDownloaded("Download");

            
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

      useEffect(() => {
        fetchDetails();
      },[hasBought])

    return(
        <div class="itemPage">
        <div class="item-details">
            <button class="close" onClick={togglePop}>x</button>

            <div class="item-order">
                {order ?(

                    <div> 
                        <div class="item-order2">
                            Product Purchased: <br />
                            <strong>
                                {new Date(Number(order.time.toString() + '000')).toLocaleDateString(
                                    undefined,
                                    {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        weekday: 'long',
                                        hour: 'numeric',
                                        minute: 'numeric',
                                        hour12: false
                                    }
                                )
                                }
                            </strong>
                        </div>
                        <button class="item-buy" onClick={downloadFile}>{hasDownloaded}</button>
                    </div>
                    
                ):(
                    <div> 
                        <div class="item-order2">
                            Product Price: <br />
                            <strong>
                                {ethers.utils.formatUnits(item.price.toString(), 'ether')} ETH
                            </strong>
                            
                        </div>
                        <button class="item-buy" onClick={buyItem}>Buy Now</button>
                    </div>
                )}
                
            </div>


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
            <div class="item-text-box2-info">
                  Sample Data Records <br />
                  <div class="item-text-box-info" >

                    {dataSample ? (
                        <TableContainer component={Paper} style={{ height: '300px', width: '940px', overflow: 'scroll'}}>
                          <Table sx={{ minWidth: 650 }} size="small">
                            <TableHead>
                              <TableRow>
                                {columns.map((column) => (
                                  <TableCell key={column}>{column}</TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {data.map((row, index) => (
                                <TableRow key={index}>
                                  {columns.map((column) => (
                                    <TableCell key={column} align="right">
                                      {row[column]}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                    ):(
                      <p>Loading Dataset...</p>
                    )}
                  </div>
                </div>
            </div>

            <div class="item-text-box-files">
                <div class="item-text-box2-info">
                        <p>Description : </p>
                        <p>{item.information}</p>
                </div>
            </div>

        </div>


    </div>

    

    );
}

export default ItemPage;