import { useEffect, useState } from 'react'
import { ethers } from 'ethers'


// TODOS: 
// 1. Add events in smart contract and event listeners in react, so whenever we're doing purchases and succesfully purchase fire a toastr or prompt a message
// 2. Add a button so that the owner of the smart contract can withdraw funds.

// Components
import Navigation from './components/Navigation'
import Section from './components/Section'
import Product from './components/Product'

// ABIs - Abstract Binary Interface which describes how the contracts work, the functions, buy function, read/writee
import Dappazon from './abis/Dappazon.json'

// Config
import config from './config.json'

function App() {
  const[provider, setProvider] = useState(null);
  const[dappazon, setDappazon] = useState(null);
  const[account, setAccount] = useState(null);

  const[electronics, setElectronics] = useState(null);
  const[clothing, setClothing] = useState(null);
  const[toys, setToys] = useState(null);

  const[item, setItem] = useState({});
  const[toggle, setToggle] = useState(false); // this just tells us whether or not the product modal should be visible on the page

  const togglePop = (item) => {
    setItem(item);
    toggle ? setToggle(false) : setToggle(true)
  }

  const loadBlockchainData = async () => {
    // Connect to blockchain
    const provider = new ethers.providers.Web3Provider(window.ethereum); // providing the blockchain connection to our website
    setProvider(provider);
    
    const network = await provider.getNetwork()
    console.log(network);

    // Connect to smart contracts (Create JS Versions)
    const dappazon = new ethers.Contract(
      config[network.chainId].dappazon.address, 
      Dappazon, 
      provider
    )
    setDappazon(dappazon);

    // Load products
    const items = []

    for(let i = 0; i < 9; i++) {
      const item = await dappazon.items(i + 1);
    
      console.log(`item ${item}`);
      items.push(item);
    }
    
    const electronics = items.filter((item) => item.category === 'electronics')
    const clothing = items.filter((item) => item.category === 'clothing')
    const toys = items.filter((item) => item.category === 'toys')

    setElectronics(electronics)
    setClothing(clothing)
    setToys(toys)
  }

  // using useEffect to call loadBlockchainData() 
  useEffect(() => {
    loadBlockchainData();
  }, [])

  return (
    <div>
      <Navigation account={account} setAccount={setAccount}/>

      <h2>Dappazon Best Sellers</h2>
      
      {
        electronics && clothing && toys &&
        (
          <><Section title={"Clothing & Jewelry"} items={clothing} togglePop={togglePop} /><Section title={"Electronics & Gadgets"} items={electronics} togglePop={togglePop} /><Section title={"Toys & Gaming"} items={toys} togglePop={togglePop} /></>
        ) 
      }
      
      { toggle && (<Product item={item} provider={provider} account={account} dappazon={dappazon} togglePop={togglePop}/>)}
    </div>
  );
}

export default App;
