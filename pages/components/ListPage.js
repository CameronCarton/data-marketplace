import { ethers } from 'ethers'
import { useEffect, useState } from 'react'

import { create} from "ipfs-http-client";
import Papa from 'papaparse';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

const ListPage = ({ items, provider, account, dataMarket, togglePop2 }) => {
    const [price, setPrice] = useState(0.0000);
    const [categoryToggle, setCategoryToggle] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [imageFile,setImageFile] = useState(null);
    const [dataFile,setDataFile] = useState(null);
    const [csvDisplay, setCsvDisplay] = useState([]);
    const [columns, setColumns] = useState();
    const [data, setData] = useState();


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


    useEffect(() => {
      const fileSelector = document.getElementById('file-selector');
      const fileSelector2 = document.getElementById('file-selector2');
      const imageContainer = document.getElementById('item-image');
      
      //selecting image file
      fileSelector.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        await setImageFile(file);

        //displaying image
        const reader = new FileReader();
        
        reader.addEventListener('load', (event) => {
          const imageUrl = event.target.result;
          const image = document.createElement('img');
          image.setAttribute('src', imageUrl);
          imageContainer.innerHTML = '';
          imageContainer.appendChild(image);
        });
  
        reader.readAsDataURL(file);
      });

      //selecting data file
      fileSelector2.addEventListener('change', async (event) => {
        const file2 = event.target.files[0];
        const reader = new FileReader();


        //displaying data
        reader.addEventListener('load', async (event) => {
            const csv = Papa.parse(event.target.result, { header: true });
            //stringify and save
            const csvString = JSON.stringify(csv);
            setDataFile(csvString);

            // Get the first 10 records of the CSV data
            const csvFirst10 = { data: csv.data.slice(0, 10), meta: csv.meta };

            //csv to display
            setCsvDisplay(JSON.stringify(csvFirst10));
            const data = csvFirst10.data;
            const columns = Object.keys(csvFirst10.data[0]);
            setData(data);
            setColumns(columns);
        });
        reader.readAsText(file2);
      });
    }, []);
  
    const handlePriceChange = (event) => {
      const inputValue = parseFloat(event.target.value);
      if (!isNaN(inputValue) && inputValue >= 0.0001) {
        setPrice(inputValue);
      }
    };
  
    function toggleCategory(){
        categoryToggle ? setCategoryToggle(false) : setCategoryToggle(true)
    };
  
    const setCategory = (category) => {
      setSelectedCategory(category);
      const button = document.querySelector('.category button');
      toggleCategory()
    };


    //listing item
    const listItem = async () => {
      //encryption
      //test key
      const secretKey = "9f8a7e6d5c4b3a291e0f1d2c3b4a5b6c7d8e9f0a1b2c3d4e5f6g7h8i9j0k1l2m3";

      //encrypt data
        var AES = require("crypto-js/aes");
        const data = AES.encrypt(
          dataFile,
          secretKey);
      
      //upload file
      const imageLink = await uploadFileToIPFS(imageFile,1)
      console.log("image file uploaded at: " + imageLink);

      //upload encrypted data
      const dataLink = await uploadFileToIPFS(data.toString(),2)
      console.log("data file uploaded at: " + dataLink);

      //upload data sample
      const dataSampleLink = await uploadFileToIPFS(csvDisplay.toString(),2)
      console.log("data Sample uploaded at: " + dataSampleLink);

      //list
      const signer = await provider.getSigner()
      const transaction = await dataMarket.connect(signer).list(
        account,
        inputName,
        imageLink,
        selectedCategory,
        ethers.utils.parseUnits(price.toString(), 'ether'),
        inputInfo,
        inputTags,
        dataLink,
        dataSampleLink,
      )
      await transaction.wait()
      console.log("listed item");
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

    //handle text input
    const [inputName, setInputName] = useState('');
    const nameChange = (event) => {
      setInputName(event.target.value);
    }
    const [inputInfo, setInputInfo] = useState('');
    const infoChange = (event) => {
      setInputInfo(event.target.value);
    }
    const [inputTags, setInputTags] = useState('');
    const tagsChange = (event) => {
      setInputTags(event.target.value);
    }



    return (
      <div class="itemPage">
        <div class="item-details">
          <button class="close" onClick={togglePop2}>x</button>
            <div class="item-details2">

                <div class="item-image" id="item-image"></div> 

                <div class="item-overview2">

                    <div class="item-text-box2">Item Name
                      <input class="item-text-box" type="text" placeholder="" onChange={nameChange}/>
                    </div>

                    <div class="item-text-box2">Price (ETH)
                      <input
                        class="item-text-box-price"
                        type="number"
                        step="0.0001"
                        min="0.0001"
                        value={price}
                        onChange={handlePriceChange}
                      />
                    </div>

                    <div class="item-text-box2">Category 
                        <div class="category">
                            <button onClick={() => toggleCategory()}>{selectedCategory}</button>
                            {categoryToggle &&(
                                <div class="category-content">
                                <a href="#" onClick={() => setCategory('Category 1')}>Category 1</a>
                                <a href="#" onClick={() => setCategory('Category 2')}>Category 2</a>
                                <a href="#" onClick={() => setCategory('Category 3')}>Category 3</a>
                                <a href="#" onClick={() => setCategory('Category 4')}>Category 4</a>
                                <a href="#" onClick={() => setCategory('Category 5')}>Category 5</a>
                                <a href="#" onClick={() => setCategory('Category 6')}>Category 6</a>
                                <a href="#" onClick={() => setCategory('Category 7')}>Category 7</a>
                                <a href="#" onClick={() => setCategory('Category 8')}>Category 8</a>
                                </div>
                            )}
                        </div>
                    </div>

                    <div class="item-text-box2-files">Image-
                      <input type="file" id="file-selector" accept="image/jpeg" />
                      <label htmlFor="file-selector" class="button"></label>
                    </div>

                    <div class="item-text-box2-files">Data-
                      <input type="file" id="file-selector2" accept="text/*" />
                      <label htmlFor="file-selector" class="button"></label>

                    </div>

                </div>

            </div>

            <div class="item-text-box-files">
                <div class="item-text-box2-info">
                  Sample Data Records <br />
                  <div class="item-text-box-info" >

                    {dataFile ? (
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
                      <p>No Data to Display</p>
                    )}
                  </div>
                </div>
            </div>

            <div class="item-text-box-files">
                <div class="item-text-box2-info">Description
                  <textarea class="item-text-box-info" rows="2" onChange={infoChange}></textarea>
                </div>
            </div>

            <div class="item-text-box-files">
                <div class="item-text-box2-tags">Item Tags 
                    <textarea class="item-text-box-tags" rows="2" onChange={tagsChange}></textarea>
                </div>
            </div>

            <div class="item-order">
                <div class="item-order2">
                </div>
                <button class="item-buy" onClick={() => listItem()}>List Item</button>
            </div>

        </div>


    </div>

    );
}

export default ListPage;