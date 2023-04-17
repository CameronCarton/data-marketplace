import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import '../styles/index.css'
import Navigation from './components/Navigation'
import Section from './components/Section'
import ItemPage from './components/ItemPage'
import ListPage from './components/ListPage'
import config from './config.json'
import DataMarket from './abi/DataMarket.json'



function App() {


  const [provider, setProvider] = useState(null);
  const [dataMarket, setDataMarket] = useState(null);
  const [account, setAccount] = useState(null);
  const [items,setItems] = useState(null);
  const [item, setItem] = useState({})
  const [toggle, setToggle] = useState(false)
  const [toggle2, setToggle2] = useState(false)



  //selects item
  const togglePop = async (item) => {
    window.scrollTo(0, 0);
    setItem(item)
    toggle ? setToggle(false) : setToggle(true)
    console.log("Loaded Item Page.")
  }
  function togglePop2 (){
    window.scrollTo(0, 0);
    toggle2 ? setToggle2(false) : setToggle2(true)
    console.log("Loaded Item Listing Page.")
  }


  //loads blockchain data
  const loadBlockchainData = async () => {
    //connecting to blockchain
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)
    const network = await provider.getNetwork()
    console.log(network)

    //Smart contracts
    const dataMarket = new ethers.Contract(
      config[network.chainId].dataMarket.address, 
      DataMarket, 
      provider)
    setDataMarket(dataMarket)

    //loads all items from smart contract into an array
    const items = [];
    const itemsLength = await dataMarket.itemId();
    for (var i=0; i<itemsLength-1; i++){
      const item = await dataMarket.items(i+1)
      if(item.name != ""){
        items.push(item);
      }
    }
    setItems(items);
  }



  useEffect(() => {
    loadBlockchainData()
  }, [])



  return (
    <div>
      <Section account={account} provider={provider} items={items} dataMarket={dataMarket} togglePop={togglePop} togglePop2={togglePop2} toggle = {toggle} toggle2 = {toggle2} setAccount={setAccount}/>

      {toggle &&(
        <ItemPage item={item} provider={provider} account={account} dataMarket={dataMarket} togglePop={togglePop} />
      )}

      {toggle2 &&(
        <ListPage provider={provider} account={account} dataMarket={dataMarket} togglePop2={togglePop2} />
      )}
    </div>
  );
}

export default App;