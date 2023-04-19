import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { create} from "ipfs-http-client";
import Papa from 'papaparse';

//csv display table
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';



const ListPage = ({provider, account, dataMarket, togglePop2 }) => {


    const [price, setPrice] = useState(0.0000);
    const [categoryToggle, setCategoryToggle] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [imageFile,setImageFile] = useState(null);
    const [dataFile,setDataFile] = useState(null);
    const [csvDisplay, setCsvDisplay] = useState([]);
    const [columns, setColumns] = useState();
    const [data, setData] = useState();
    const [inputName, setInputName] = useState('');
    const [inputInfo, setInputInfo] = useState('');
    const [inputTags, setInputTags] = useState('');



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



    //Selecting Image and Data File
    useEffect(() => {
      const fileSelector = document.getElementById('file-selector');
      const fileSelector2 = document.getElementById('file-selector2');
      const imageContainer = document.getElementById('item-image');
      
      //selecting image file
      fileSelector.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        setImageFile(file);

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

          //stringify and save
          const csv = Papa.parse(event.target.result, { header: true });
          const csvString = JSON.stringify(csv);
          setDataFile(csvString);

          // Get the first 10 records of the CSV data
          const csvFirst10 = { data: csv.data.slice(0, 10), meta: csv.meta };

          //count how many columns
          const csvLength = csv.data.length;

          //csv to display
          const csvData = {
            dataLength: csvLength,
            first10: csvFirst10
          };
          setCsvDisplay(JSON.stringify(csvData));

          const data = csvFirst10.data;
          const columns = Object.keys(csvFirst10.data[0]);
          setData(data);
          setColumns(columns);

        });

        reader.readAsText(file2);
      });
    }, []);


  
    //Input price for listing
    const handlePriceChange = (event) => {
      const inputValue = parseFloat(event.target.value);
      if (!isNaN(inputValue) && inputValue >= 0.0001) {
        setPrice(inputValue);
      }
    };



    //Category select window
    function toggleCategory(){
        categoryToggle ? setCategoryToggle(false) : setCategoryToggle(true)
    };
  


    //Category select
    const setCategory = (category) => {
      setSelectedCategory(category);
      const button = document.querySelector('.category button');
      toggleCategory()
    };



    //Listing item
    const listItem = async () => {
      
      try{
      //Upload file
      const imageLink = await uploadFileToIPFS(imageFile,1)
      console.log("Image File uploaded at: " + imageLink);

      //Upload data sample
      const dataSampleLink = await uploadFileToIPFS(csvDisplay.toString(),2)
      console.log("Data Sample uploaded at: https://ipfs.io/ipfs/" + dataSampleLink);

      //List item in Smart contract
      const signer = await provider.getSigner()
      const transaction = await dataMarket.connect(signer).list(
        account,
        inputName,
        imageLink,
        selectedCategory,
        ethers.utils.parseUnits(price.toString(), 'ether'),
        inputInfo,
        inputTags,
        dataSampleLink,
      )
      await transaction.wait()
      console.log("LISTED ITEM: " + inputName);
      }catch(err){
        console.log("FILL IN ALL * SECTIONS TO LIST!");
      }
    }



    //handle text input
    const nameChange = (event) => {
      setInputName(event.target.value);
    }
    const infoChange = (event) => {
      setInputInfo(event.target.value);
    }
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

              <div class="item-text-box2">Item Name *
                <input class="item-text-box" type="text" placeholder="" onChange={nameChange}/>
              </div>

              <div class="item-text-box2">Price (ETH) *
                <input
                  class="item-text-box-price"
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={price}
                  onChange={handlePriceChange}
                />
              </div>



              <div class="item-text-box2">Category * 
                <div class="category">
                  <button onClick={() => toggleCategory()}>{selectedCategory}</button>
                    {categoryToggle &&(
                      <div class="category-content">
                        <a href="#" onClick={() => setCategory('Demographic')}>Demographic</a>
                        <a href="#" onClick={() => setCategory('Financial')}>Financial</a>
                        <a href="#" onClick={() => setCategory('Geographic')}>Geographic</a>
                        <a href="#" onClick={() => setCategory('Consumer behavior')}>Consumer</a>
                        <a href="#" onClick={() => setCategory('Environmental')}>Environmental</a>
                        <a href="#" onClick={() => setCategory('Social media')}>Social media</a>
                        <a href="#" onClick={() => setCategory('Medical')}>Medical</a>
                        <a href="#" onClick={() => setCategory('Other')}>Other</a>
                        </div>
                      )}
                    </div>
                  </div>


                  <div class="item-text-box2-files">Image * -
                    <input type="file" id="file-selector" accept="image/jpeg" />
                    <label htmlFor="file-selector" class="button"></label>
                  </div>


                  <div class="item-text-box2-files">Data * -
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