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
    const [startBuyPage, setStartBuyPage] = useState(false);
    const [startOrderPage, setStartOrderPage] = useState(false);
    const [startDownloadPage, setStartDownloadPage] = useState(false);
    const [order_buyer, setOrder_buyer] = useState(false);


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



    //Necessary Details for order and item
    const fetchDetails = async () => {

      //Get sample data from IPFS
      console.log("Retrieving Data Sample from IPFS...");

      await fetch("https://ipfs.io/ipfs/" + (item.dataSample).toString())
      .then(response => response.text())
      .then(async (data) => {

        setDataSample(data);

        //Converting data retrieved to a usable form to display
        const jsonData = Papa.unparse(data);
        const parsed = Papa.parse(jsonData)
        const data_ = parsed.data;
        const columns = Object.keys(parsed.data[0]);
        setData(data_);
        setColumns(columns);

      }).catch((err) => {
        console.error(err);
      });

      console.log("Data Sample Retrieved!");



      //Checks if your account is the owner (account that Listed the item) of the item
      const owner = await item.owner;
      if(owner.toString() == account.toString()){

        setIsOwner(true);

        //Creates a List of all the current unfulfilled orders to the item
        const allOrders = [];
        const userOrders = await dataMarket.userOrders(owner);

        for (var i=1; i<=userOrders; i++){
          const order_ = await dataMarket.orders(owner,i);
          const completed = await order_.complete;
          const order_item = order_.item;

          //Order completed is 1 if the order exists but is not fulfilled
          if((order_item.id).toString() == (item.id).toString() && (completed).toString()=="1"){
            allOrders.push(order_);
          }
        }

        setAllOrders(allOrders);

      }else{

        setIsOwner(false);

        //Checks orders to see if your account has a fulfulled order
        //meaning you have bought the item and the Owner has sent it to you
        const userOrders = await dataMarket.userOrders(owner);

        for (var i=1; i<=userOrders; i++){
          const order_ = await dataMarket.orders(owner,i);
          const completed = await order_.complete;
          const order_item = order_.item;

          //Order completed is 2 if the order exists and is fulfilled
          if((order_item.id).toString() == (item.id).toString() && order_.buyer == account && (completed).toString()=="2"){
            setOrder(order_);
            break;
          }
        }

      }

    }



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
        const accountAddress = ethers.utils.getAddress(account);
        const buyerAddress = ethers.utils.getAddress(buyer);
        const completed = 2;
        const dataLocation = dataLink;
        const itemID = parseInt(item.id);

        //Seller public key (gs_key) is stored in Smart Contract
        const signer = await provider.getSigner();
        let transaction = dataMarket.connect(signer).setOrderComplete(accountAddress, 
                                                                      buyerAddress, 
                                                                      itemID, 
                                                                      completed, 
                                                                      gs_key, 
                                                                      dataLocation);
        await transaction;

      });

      //reads in file
      reader.readAsText(await file2);

    }



    //When Buyer Places Order
    const buyItem = async () => {

      // Diffie Hellman Key Exchange
      const crypto = require('crypto');

      //Get Generator and Prime from modp15
      const buyer_key = crypto.getDiffieHellman('modp15');

      //Get Public and Private Keys
      buyer_key.generateKeys();
      const b_key = buyer_key.getPrivateKey();
      const gb_key = buyer_key.getPublicKey('hex');



      //Place Order and Complete transaction
      const signer = await provider.getSigner();
      let transaction = dataMarket.connect(signer).buy(item.id, 
                                                      gb_key, 
                                                      {value: item.price});
      const trans = await transaction;
      console.log("ORDER PLACED!");


      //Download Private Key as a file (I gave it a .key extension so its easy to find)
      downloadCSV(JSON.stringify(b_key), "SECRET KEY _ " + (item.name).toString(), ".key");

      setHasBought(true);
    }



    //Downloading Data
    async function downloadFile(){

      //Get the input Private Key Decryption File
      const fileSelector3 = document.getElementById('file-selector3');
      const file2 = fileSelector3.files[0];
      const reader = new FileReader();



      //Reading in the Key and Decrypting the Data from IPFS
      reader.addEventListener('load', async (event) => {

        //Reading in Private Key and Converting it to Buffer Object
        var enc = require("crypto-js/enc-utf8");
        const b_key_input = JSON.parse((event.target.result).toString(enc))



        //Retrieve the Encrypted Data from IPFS
        setHasDownloaded("Fetching Data...");
        console.log("retrieving data from ipfs...");

        await fetch("https://ipfs.io/ipfs/" + (order.data).toString())
        .then(response => response.text())
        .then(async (data) => {

          // Diffie Hellman Key Exchange
          const crypto = require('crypto');

          //Get Generator and Prime from modp15
          const diffieHellman = crypto.getDiffieHellman('modp15');
          const gen = diffieHellman.getGenerator('hex');
          const prime = diffieHellman.getPrime('hex');

          //Creates a new DiffieHellman Object with the modp15 Prime and Generator
          //This is because we already have a buyer private key
          //and "getDiffieHellman" objects don't support "setPrivateKey"
          const buyer_key = crypto.createDiffieHellman(prime, 'hex', gen, 'hex');
          
          //Set Buyer Private Key to the Key from the Inputted File
          buyer_key.generateKeys();
          buyer_key.setPrivateKey(b_key_input);

          //Get Seller Public Key From Order (Smart Contract)
          const gs = order.gs;



          //Generate the main Secret Key
          const secretKey = buyer_key.computeSecret(Buffer.from(gs, 'hex'),null,'hex');
          const secretDecode = new TextDecoder('utf8').decode(secretKey);



          //Decrypt the Data from IPFS
          var AES = require("crypto-js/aes");

          const dataToDecrypt = data.toString();
          const decryptedData = AES.decrypt(dataToDecrypt, secretDecode);



          //Convert the data back to from a JSON to a csv
          const parsedData = JSON.parse(decryptedData.toString(enc));

          setHasDownloaded("Downloading");



          //Download File
          downloadCSV(parsedData.data, (item.name).toString(), ".csv");

          }).catch((err) => {
            console.error(err);
          });

          console.log("Data Retrieved!");

          setHasDownloaded("Download");

      });

      //Read in File
      reader.readAsText(await file2);

    };



    //Convert data to csv file
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
    

    //Download csv file (option to download Secret Key file type too)
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


  
  //Fetch Details for item and orders
  useEffect(() => {
    fetchDetails();
  },[hasBought])



  //Start Buy Menu
  const startBuy = async (bool) => {
    setStartBuyPage(bool);
  }



    //Start Order Menu
    const startOrder = async (bool, buyer_order) => {
      setOrder_buyer(buyer_order.buyer);
      setOrder(buyer_order);
      setStartOrderPage(bool);
    }



    //Start Download Menu
    const startDownload = async (bool) => {
      setStartDownloadPage(bool);
    }



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
                      )}
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

              <div class="item-text-box2-files">
                
                Data-

                <input type="file" id="file-selector2" accept="text/*" />
                <label htmlFor="file-selector" class="button"></label>

              </div>

                
              <button class="profile-button" onClick={() => acceptOrder(order_buyer)}>Complete Order</button>
              <button class="profile-button" onClick={() => startOrder(false, account)}>Return to Product page</button>

            </div>
          </div>
        )}



        {startDownloadPage &&(
          <div class="itemPage">
            <div class="item-details" style={{ "max-width":"800px", height: "20%", top: "100px"}}>

              <p>Download</p>

              <strong>{(item.owner).toString()}</strong>


              <div class="item-text-box2-files">

                Data-

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