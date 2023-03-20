import { ethers } from 'ethers'
import { useEffect, useState } from 'react'

import { create} from "ipfs-http-client";
import Papa from 'papaparse';

const ListPage = ({ items, provider, account, dataMarket, togglePop2 }) => {
    const [price, setPrice] = useState(0.0000);
    const [categoryToggle, setCategoryToggle] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [imageFile,setImageFile] = useState(null);
    const [dataFile,setDataFile] = useState(null);
    const [data, setData] = useState([]);

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
        await setDataFile(file2);

        //displaying data
        const reader = new FileReader();
        
        reader.addEventListener('load', (event) => {
            const csv = Papa.parse(event.target.result, { header: true });
            const parsedData = csv?.data;
            const columns = Object.keys(parsedData[0]);
            setData(columns);
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
        console.log("toggled category")
    };
  
    const setCategory = (category) => {
      setSelectedCategory(category);
      const button = document.querySelector('.category button');
      toggleCategory()
    };

    //listing item
    const listItem = async () => {

      const imageLink = await uploadFileToIPFS(imageFile)
      console.log("image file uploaded at: " + imageLink);

      const dataLink = await uploadFileToIPFS(dataFile)
      console.log("data file uploaded at: " + dataLink);

      const signer = await provider.getSigner()
      const transaction = await dataMarket.connect(signer).list(
        items.length +1,
        inputName,
        imageLink,
        selectedCategory,
        ethers.utils.parseUnits(price.toString(), 'ether'),
        inputInfo,
        inputTags,
        dataLink,
      )
      await transaction.wait()
      console.log("listed item");
    }

    //ipfs
    const uploadFileToIPFS = async (file) => {
      console.log("beginning upload to ipfs...")
  
      const fileLink = await ipfs.add(file);

      console.log("finished upload to ipfs!")

      return "https://ipfs.io/ipfs/"+fileLink.path;
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
          <button class="close" onClick={togglePop2}>
            x
          </button>
          <div class="item-details2">
            <div class="item-overview">
              <div class="item-image" id="item-image"></div>
  
              <div class="item-text-box-files">
                <div class="item-text-box2-files">
                  Image-
                  <input type="file" id="file-selector" accept="image/jpeg" />
                  <label htmlFor="file-selector" class="button"></label>
                </div>
                <div class="item-text-box2-files">
                  Data-
                  <input type="file" id="file-selector2" accept="text/*" />
                  <label htmlFor="file-selector" class="button"></label>

                  {dataFile ? (
                  <div>
                      {data.map((col,idx) => <div key={idx}>{col}</div>)}
                  </div>
                  ):(
                    <p>null</p>
                  )}
                </div>
              </div>
                    
              <div class="item-overview2">
              <div class="item-text-box2">
                Item Name
                <input class="item-text-box" type="text" placeholder="" onChange={nameChange}/>
              </div>
              <div class="item-text-box2">
                Price (ETH)
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
                    <div class="item-text-box2-tags">Item Tags 
                        <textarea class="item-text-box-tags" rows="2" onChange={tagsChange}></textarea>
                    </div>
                    <div class="item-text-box2-info">Information
                        <textarea class="item-text-box-info" rows="2" onChange={infoChange}></textarea>
                    </div>
                </div>

                </div>
                <div class="item-order">
                    <div class="item-order2">
                    </div>
                    <button class="item-buy" onClick={() => listItem()}>List Item</button>
                </div>
            </div>
        </div>
    </div>

    );
}

export default ListPage;