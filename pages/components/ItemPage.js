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
    const [allOrders,setAllOrders] = useState(null);
    const [hasBought,setHasBought] = useState(false);
    const [isOwner,setIsOwner] = useState(false);
    const [hasDownloaded,setHasDownloaded] = useState("Download");
    const [dataSample, setDataSample] = useState(null);
    const [columns, setColumns] = useState();
    const [data, setData] = useState();
    const [dataFile,setDataFile] = useState(null);
    const [b_key_input,setB_key_input] = useState(null);

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

        //check if you are the owner
        const owner = await item.owner;
        if(owner.toString() == account.toString()){
          setIsOwner(true);
          console.log("is owner");

          //check currentorders
          const allOrders = [];
          const userOrders = await dataMarket.userOrders(owner);
          for (var i=1; i<=userOrders; i++){
            const order_ = await dataMarket.orders(owner,i);
            const completed = await order_.complete;
            const order_item = order_.item;
            if((order_item.id).toString() == (item.id).toString() && (completed).toString()=="1"){
              allOrders.push(order_);
            }
          }

          setAllOrders(allOrders);

        }else{
          setIsOwner(false);
          console.log("is not owner");

          //check orders
          const userOrders = await dataMarket.userOrders(owner);
          for (var i=1; i<=userOrders; i++){
            const order_ = await dataMarket.orders(owner,i);
            const completed = await order_.complete;
            const order_item = order_.item;
            if((order_item.id).toString() == (item.id).toString() && order_.buyer == account && (completed).toString()=="2"){
              setOrder(order_);
              break;
            }
          }
        }
        console.log("YOUR ADDRESS: " + account.toString() + "  |||  OWNER ADDRESS: " + owner);

    }

    //accepting order (seller does this)
    const acceptOrder = async (buyer) => {

      //get datafile
      const fileSelector2 = document.getElementById('file-selector2');
      const file2 = fileSelector2.files[0];
      const reader = new FileReader();
      
  
          //displaying data
          reader.addEventListener('load', async (event) => {
              const csv = Papa.parse(event.target.result, { header: true });
              //stringify and save
              const dataFile = JSON.stringify(csv);
              setDataFile(dataFile);


              //accept buy
              const crypto = require('crypto');
              const seller_key = crypto.getDiffieHellman('modp15');
              seller_key.generateKeys();
              const gs_key = seller_key.getPublicKey('hex');
              

              //encryption
              //main key
              const gb = order.gb;
              console.log(gb);
              const secretKey = seller_key.computeSecret(Buffer.from(gb, 'hex'),null,'hex');
              const secretDecode = new TextDecoder('utf8').decode(secretKey);
              console.log(secretDecode);

              //encrypt data
                var AES = require("crypto-js/aes");
                const data = AES.encrypt(
                  dataFile,
                  secretDecode);

              //upload encrypted data
              const dataLink = await uploadFileToIPFS(data.toString(),2)
              console.log("data file uploaded at: " + dataLink);

              const accountAddress = ethers.utils.getAddress(account);
              const buyerAddress = ethers.utils.getAddress(buyer);
              const completed = 2;
              const dataLocation = dataLink;
              const itemID = parseInt(item.id);

              //send s key and data transaction
              const signer = await provider.getSigner();
              let transaction2 = dataMarket.connect(signer).setOrderComplete(accountAddress, buyerAddress, 
                                                                            itemID, 
                                                                            completed, 
                                                                            gs_key, 
                                                                            dataLocation);
              const trans2 = await transaction2;

          });
      reader.readAsText(await file2);

    }

    //ipfs
    const uploadFileToIPFS = async (file, type) => {
      console.log("beginning upload to ipfs...")
  
      const fileLink = await ipfs.add(file);

      console.log("finished upload to ipfs!")

      //this is for image or file cids, i am only saving the cid for the file data location
      //however i am storing the whole url for the image data
      if(type==1)
      return "https://ipfs.io/ipfs/"+fileLink.path;

      if(type==2)
      return fileLink.path;
    };

    //payment
    const [startBuyPage, setStartBuyPage] = useState(false);
    const [startOrderPage, setStartOrderPage] = useState(false);
    const [startDownloadPage, setStartDownloadPage] = useState(false);
    const [order_buyer, setOrder_buyer] = useState(false);
    const startBuy = async (bool) => {
      setStartBuyPage(bool);
    }
    const startOrder = async (bool, buyer_order) => {
      setOrder_buyer(buyer_order.buyer);
      setOrder(buyer_order);
      setStartOrderPage(bool);
    }
    const startDownload = async (bool) => {
      setStartDownloadPage(bool);
    }

    const [b_key, setB_key] = useState("");
    const buyItem = async () => {


        //generate keys for order
        const crypto = require('crypto');
        const buyer_key = crypto.getDiffieHellman('modp15');
        buyer_key.generateKeys();
        const b_key = buyer_key.getPrivateKey();
        setB_key(b_key);
        console.log("buyer private key : ", JSON.stringify(b_key))
        const gb_key = buyer_key.getPublicKey('hex');

        //buy
        const signer = await provider.getSigner();

        let transaction = dataMarket.connect(signer).buy(item.id, 
                                                        gb_key, 
                                                          {value: item.price});
        const trans = await transaction;

        downloadCSV(JSON.stringify(b_key), "SECRET KEY _ " + (item.name).toString(), ".key");

        console.log("buying item  " + trans.toString());

        setHasBought(true);
    }


    //download file from ipfs
    async function downloadFile(){

      //get datafile
      const fileSelector3 = document.getElementById('file-selector3');
      const file2 = fileSelector3.files[0];
      const reader = new FileReader();

      //reading in file
      reader.addEventListener('load', async (event) => {

        var enc = require("crypto-js/enc-utf8");

        const b_key_input = JSON.parse((event.target.result).toString(enc))
        setB_key_input(b_key_input);
        console.log(b_key_input);

            //get data
            setHasDownloaded("Fetching Data...");
            console.log("retrieving data from ipfs...");
            await fetch("https://ipfs.io/ipfs/" + (order.data).toString())
            .then(response => response.text())
            .then(async (data) => {

                const dataJSON = data;
                
              
              const crypto = require('crypto');
              //encryption
              //main key
              const gs = order.gs;
              const diffieHellman = crypto.getDiffieHellman('modp15');
              const gen = diffieHellman.getGenerator('hex');
              const prime = diffieHellman.getPrime('hex');
              const buyer_key = crypto.createDiffieHellman(prime, 'hex', gen, 'hex');
              
              console.log(buyer_key.getPrime());
              
              buyer_key.generateKeys();
              buyer_key.setPrivateKey(b_key_input);

              const secretKey = buyer_key.computeSecret(Buffer.from(gs, 'hex'),null,'hex');
              const secretDecode = new TextDecoder('utf8').decode(secretKey);
              console.log(secretKey);
              console.log(secretDecode);
                // Decrypt the string
                var AES = require("crypto-js/aes");

                const dataToDecrypt = dataJSON.toString();
                const decryptedData = AES.decrypt(dataToDecrypt, secretDecode);



                //convert back to json data
                const parsedData = JSON.parse(decryptedData.toString(enc));

                setHasDownloaded("Downloading");

                //download file
                downloadCSV(parsedData.data, (item.name).toString(), ".csv");

                }).catch((err) => {
                console.error(err);
                });
            console.log("data retrieved!");
            setHasDownloaded("Download");

            });
      reader.readAsText(await file2);
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
      
      const downloadCSV = (data, name, type) => {
        let blob;
        if(type==".csv"){
          const csv = convertToCSV(data);
          blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        }
        if(type==".key"){
          blob = new Blob([data], { type: "text/txt;charset=utf-8;" });
        }
        saveAs(blob, name + type);
      };

      useEffect(() => {
        fetchDetails();
      },[hasBought])


    return(
      <>
        <div class="itemPage">
        <div class="item-details">
            <button class="close" onClick={togglePop}>x</button>

            <div class="item-order">
                {order && !isOwner ?(

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
                        <button class="item-buy" onClick={() => startDownload(true)}>{hasDownloaded}</button>
                    </div>
                    
                ):(
                    <div> 
                      <div class="item-order2">
                        Product Price: <br />
                        <strong>
                          {ethers.utils.formatUnits(item.price.toString(), 'ether')} ETH
                        </strong>     
                      </div>

                      <button class="item-buy" onClick={() => startBuy(true)}>Buy Now</button>
                    </div>
                )}

                {isOwner ?(
                  <div>
                    <div class="item-order2">
                      This Product was Listed by you for: <br />
                        <strong>
                          {ethers.utils.formatUnits(item.price.toString(), 'ether')} ETH
                        </strong> 
                    </div>
                    <button class="item-buy" onClick={downloadFile}>Download</button>
                  </div>
                ):(
                  <></>
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

            <div class="item-text-box-files" style={{ height: '38%'}}>
                <div class="item-text-box2-info">
                        Description
                      <textarea class="item-text-box-info" rows="2" readOnly >
                        {item.information}</textarea>
                </div>
            </div>
            
            <div class="item-text-box-files" style={{ height: '10%', width: "60%", left: "70px"}}>
                <div class="item-text-box2-info" style={{ display: "inline-block"}}>
                Orders
                        {allOrders &&(
                          <>
                          {allOrders.map((order, i) => (
                            <>
                            <div class="profile-button" key={i} onClick={() => startOrder(true, order)}>
                                <strong>{(order.buyer).toString()}</strong>
                            </div>
                            </>
                        ))}
                          </>
                      )}
                </div>
            </div>
        </div>


    </div>

    {startBuyPage &&(
      <div class="itemPage">
      <div class="item-details" style={{ "max-width":"800px", height: "20%", top: "100px"}}>
            <p>Confirm Purchase of</p>
            <strong>{item.name}</strong>
            <button class="profile-button" onClick={buyItem}>Proceed to Payment</button>
            <button class="profile-button" onClick={() => startBuy(false)}>Return to Product page</button>
      </div>
    </div>
    )}

    {startOrderPage &&(
      <div class="itemPage">
      <div class="item-details" style={{ "max-width":"800px", height: "20%", top: "100px"}}>
            <p>Complete Sale to</p>
            <strong>{(item.owner).toString()}</strong>

            <div class="item-text-box2-files">Data-
                      <input type="file" id="file-selector2" accept="text/*" />
                      <label htmlFor="file-selector" class="button"></label>

            </div>

            <button class="profile-button" onClick={() => acceptOrder(order_buyer)}>Complete Order</button>
            <button class="profile-button" onClick={() => startOrder(false, null)}>Return to Product page</button>
      </div>
    </div>
    )}

{startDownloadPage &&(
      <div class="itemPage">
      <div class="item-details" style={{ "max-width":"800px", height: "20%", top: "100px"}}>
            <p>Download</p>
            <strong>{(item.owner).toString()}</strong>

            <div class="item-text-box2-files">Data-
                      <input type="file" id="file-selector3" />
                      <label htmlFor="file-selector" class="button"></label>

            </div>

            <button class="profile-button" onClick={downloadFile}>Download</button>
            <button class="profile-button" onClick={() => startDownload(false)}>Return to Product page</button>
      </div>
    </div>
    )}
  
    </>

    );
}

export default ItemPage;