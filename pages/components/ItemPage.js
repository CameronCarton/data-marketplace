import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
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
    const [isOwner,setIsOwner] = useState(false);
    const [hasDownloaded,setHasDownloaded] = useState("Download");
    const [dataSample, setDataSample] = useState(null);
    const [dataLength, setDataLength] = useState(0);
    const [columns, setColumns] = useState();
    const [data, setData] = useState();
    const [startBuyPage, setStartBuyPage] = useState(false);
    const [startDownloadPage, setStartDownloadPage] = useState(false);
    const [reviewPage, setReviewPage] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [price, setPrice] = useState(5);
    const [ inputReviewText, setInputReviewText] = useState(null);

    //Necessary Details for order and item
    const fetchDetails = async () => {

      //Get sample data from IPFS
      console.log("Retrieving Data Sample from IPFS...");

      await fetch("https://ipfs.io/ipfs/" + (item.dataSample).toString())
      .then(response => response.text())
      .then(async (data) => {

        const _data = JSON.parse(data);

        const sampledData = _data.first10;

        setDataSample(sampledData);
        setDataLength(_data.dataLength);
        //Converting data retrieved to a usable form to display
        const jsonData = Papa.unparse(sampledData);
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
          if((order_item.id).toString() == (item.id).toString() && order_.buyer == account && ((completed).toString()=="1" || (completed).toString()=="2")){
            setOrder(order_);
            break;
          }
        }

      }


      //fetch reviews for item
      const reviews = [];
      const itemReviewAmount = await dataMarket.itemReviewAmount(item.id);

      for (var i=1; i<=itemReviewAmount; i++){
        const review_ = await dataMarket.reviews(item.id,i);
        reviews.push(review_);
      }
      setReviews(reviews);
      console.log(reviews);

    }



    //Star rating input
    const handlePriceChange = (event) => {
      const inputValue = parseFloat(event.target.value);
      if (!isNaN(inputValue)) {
          setPrice(inputValue);
      }
    };



    //When Buyer Places Order
    const buyItem = async () => {

      startBuy(false);
      try{
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
      togglePop();
      }catch(err){
        console.log("TRANSACTION DENIED!")
      }
    }



    //withdraw payment (cancel order)
    const withdrawPayment = async () => {

      try{
      //withdraw ETH from order (cancel order)
      const signer = await provider.getSigner();
      let transaction = dataMarket.connect(signer).withdrawOrder(order.id,item.owner,item.id);
      const trans = await transaction;
      console.log("ORDER CANCELLED!");

      }catch(err){
        console.log("TRANSACTION DENIED!")
      }
    }



    //Downloading Data
    async function downloadFile(){

      try{
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
        console.log("Retrieving Data from IPFS...");

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
            console.log("INCORRECT DECRYPTION KEY!");
          });

          console.log("Data Retrieved!");

          setHasDownloaded("Download");

      });

      //Read in File
      reader.readAsText(await file2);
      startDownload(false);

    }catch(err){
      console.log("NO DECRYPTION KEY SELECTED!");
    }
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



    //delete listing if you are the owner
    const deleteListing = async () => {
      const signer = await provider.getSigner();
      let transaction = dataMarket.connect(signer).deleteItem(item.id);
      await transaction;
      togglePop();
    }



    //Post Review
    const postReview = async () => {
      try{
      //List item in Smart contract
      console.log(parseInt(item.id));
      console.log(parseInt(order.id));
      console.log(parseInt(price));
      console.log(inputReviewText.toString());
      const signer = await provider.getSigner()
      const transaction = await dataMarket.connect(signer).postReview(
        parseInt(item.id),
        parseInt(order.id),
        parseInt(price),
        inputReviewText.toString()
      )
      await transaction.wait()
      console.log("REVIEW POSTED!");
      }catch(err){
        console.log("REVIEW DENIED!");
      }
    }

  
    //Fetch Details for item and orders
    useEffect(() => {
      fetchDetails();
    },[hasBought])



    //Start Buy Menu
    const startBuy = (bool) => {
      window.scrollTo(0, 0);
      setStartBuyPage(bool);
    }



    //Start Download Menu
    const startDownload = (bool) => {
      window.scrollTo(0, 0);
      setStartDownloadPage(bool);
    }



    //handle review text input
    const reviewTextChange = (event) => {
      setInputReviewText(event.target.value);
    }



    //reviewpage change
    const setReviewPageVal = () => {
      reviewPage ? setReviewPage(false) : setReviewPage(true)
    }



    return(
      <>
        <div class="itemPage">
          <div class="item-details">
            <button class="close" onClick={togglePop}>x</button>

            <div class="item-order">
              {order && order.complete==2 && !isOwner ?(

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
                  <>
                    {order && order.complete==1 ?(
                      <>
                      <div> 
                        <div class="item-order2">
                          You have an Active Order: <br />  
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

                        <button class="item-buy" onClick={withdrawPayment}>Cancel Order</button>
                      </div>
                      </>
                    ):(
                      <>
                        <div> 
                          <div class="item-order2">
                            Product Price: <br />
                            <strong>
                              {ethers.utils.formatUnits(item.price.toString(), 'ether')} ETH
                            </strong>     
                          </div>

                          <button class="item-buy" onClick={() => startBuy(true)}>Buy Now</button>
                        </div>
                      </>
                    )}
                  </>
                )}


                {isOwner ?(
                  <div>
                    <div class="item-order2">
                      This Product was Listed by you for: <br />
                        <strong>
                          {ethers.utils.formatUnits(item.price.toString(), 'ether')} ETH
                        </strong> 
                    </div>
                    <button class="item-buy" onClick={deleteListing}>Delete Listing</button>
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
                  <p>Star Rating : </p>
                  <p>{(item.stars).toString()}</p>
                </div>

                <div class="item-text-box2">
                  <p>Price : </p>
                  <p>{ethers.utils.formatUnits(item.price.toString(), 'ether')} ETH</p>
                </div>

                <div class="item-text-box2">
                  <p>Category : </p>
                  <p>{item.category}</p>
                </div>

                <div class="item-text-box2">
                  <p>Number of Rows : </p>
                  <p>{dataLength.toString()}</p>
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
            


            <div class="item-text-box-files" style={{ height: '10%', width: "55%", left: "60px",top:"-80px"}}>
              <div class="profile-button"  style={{top:"30px",left:"150px",width:"30%","z-index":"5"}} onClick={setReviewPageVal}>Write a Review</div>
              <div class="item-text-box2-info" style={{ display: "inline-block","height":"340px","max-height":"340px",overflow: 'scroll'}}>
                <p>Reviews</p>
                <br/>
                <p></p>
                {reviewPage ?(
                  <div>
                  Star Rating
                  <input
                          class="item-text-box-price2"
                          type="number"
                          step="1"
                          min="1"
                          max="5"
                          value={price}
                          onChange={handlePriceChange}
                          style={{width: "10%","margin-left":"110px",top:"40px"}}
                      />
                    <textarea class="item-text-box-info" onChange={reviewTextChange} rows="2" style={{top:"65px",left:"60px",height:"120px","min-height": "80px","max-height":"120px",width:"90%"}}></textarea>
                    <div class="profile-button" onClick={postReview} style={{top:"170px",left:"400px",width:"30%"}}>Post Review</div>
                  </div>
                ):(
                  <div >
                    {reviews &&(
                      <>
                        {reviews.map((review, i) => (
                          <>
                            <div class="review-container" key={i}> 
                              {review.stars >= 1 && review.stars < 1.5 &&(<p>{"*"}</p>)}
                              {review.stars >= 1.5 && review.stars < 2.5 &&(<p>{"**"}</p>)}
                              {review.stars >= 2.5 && review.stars < 3.5 &&(<p>{"***"}</p>)}
                              {review.stars >= 3.5 && review.stars < 4.5 &&(<p>{"****"}</p>)}
                              {review.stars >= 4.5 && review.stars <= 5 &&(<p>{"*****"}</p>)}

                              <p>{"ADDRESS: " + (review.buyer).toString()} </p>
                              <p>{"REVIEW TEXT: " + (review.text).toString()} </p>
                            </div>
                          </>
                        ))}
                      </>
                    )}
                  </div>
                )}
                
                

              </div>
            </div>


          </div>

        </div>



        {startBuyPage &&(
          <div class="itemPage">
            <div class="item-details" style={{ "max-width":"800px", height: "20%", 
                                              top: "200px", "text-align":"center","justify-Content":"center",
                                              "font-size":"1.5rem","padding-top":"100px"}}>

              <p>Confirm Purchase of</p>

              <p>{item.name}</p>

              <p>{"for " + ethers.utils.formatUnits(item.price.toString(), 'ether') + " ETH"}</p>

              <br/>
              <button class="profile-button" onClick={buyItem} style={{"max-width":"80%", left:"0%"}}>Proceed to Payment</button>
              <button class="profile-button" onClick={() => startBuy(false)} style={{"max-width":"80%", left:"0%"}}>Return to Product page</button>

            </div>
          </div>
        )}



        {startDownloadPage &&(
          <div class="itemPage">
            <div class="item-details" style={{ "max-width":"800px", height: "20%", 
                                              top: "200px", "text-align":"center","justify-Content":"center",
                                              "font-size":"1.5rem","padding-top":"100px"}}>


              <strong>{(item.name).toString()}</strong>


              <div class="item-text-box2-files" style={{"left":"25%","text-align":"center","justify-Content":"center"}}>

                Select your Decryption Key-

                <input type="file" id="file-selector3" />
                <label htmlFor="file-selector" class="button"></label>

              </div>


              <button class="profile-button" onClick={downloadFile} style={{"max-width":"80%", left:"0%"}}>Download</button>
              <button class="profile-button" onClick={() => startDownload(false)} style={{"max-width":"80%", left:"0%"}}>Return to Product page</button>

            </div>
          </div>
        )}
  
      </>

    );
}

export default ItemPage;