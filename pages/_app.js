import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import '../styles/index.css'

// Components
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

  const togglePop = async (item) => {
    setItem(item)
    toggle ? setToggle(false) : setToggle(true)
    console.log("item selected page")
  }
  function togglePop2 (){
    toggle2 ? setToggle2(false) : setToggle2(true)
    console.log("list item page")
  }

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

    //loading items
    const items = [];
    const itemsLength = 20
    for (var i=0; i<itemsLength; i++){
      const item = await dataMarket.items(i+1)
      if(item.name != ""){
        items.push(item);
      }
    }

    setItems(items);

    console.log(items);
  }

  useEffect(() => {
    loadBlockchainData()
  }, [])

  return (
    <div>
      <Navigation account={account} setAccount={setAccount}/>
      <Section account={account} items={items} togglePop={togglePop} togglePop2={togglePop2}/>

      {toggle &&(
        <ItemPage item={item} provider={provider} account={account} dataMarket={dataMarket} togglePop={togglePop} />
      )}

      {toggle2 &&(
        <ListPage items={items} provider={provider} account={account} dataMarket={dataMarket} togglePop2={togglePop2} />
      )}
    </div>
  );
}

export default App;