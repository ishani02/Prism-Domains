import React, { useEffect, useState } from "react"
import "../styles/LandingPage.css";
import "../styles/NavBar.css";
import "../styles/Dashboard.css";
import { ethers } from "ethers";
import contractABI from "../utils/contractABI.json";
import Typewriter from 'typewriter-effect';
import { networks, switchToPolygonMumbai, POLYGON_MUMBAI_CHAIN_ID, getMetaMaskProvider, getMetaMaskProviderAsync } from '../utils/networks';
import { Element } from "react-scroll";
import Dashboard from "./Dashboard";
const tld = ".prism";
const CONTRACT_ADDRESS = "0x2db04e565C99E944a4BF534d2bD44B87aA898A37";

function LandingPage() {
    const ethereum = getMetaMaskProvider();
    const [currentAccount, setCurrentAccount] = useState('');
    const [domain, setDomain] = useState('');
    const [record, setRecord] = useState('');
    const [network, setNetwork] = useState('');
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mints, setMints] = useState([]);
    
    const connectWallet = async () => {
        try {
          const provider = await getMetaMaskProviderAsync();
          if (!provider) {
            alert("MetaMask is required. Please install it from https://metamask.io/");
            return;
          }
          const accounts = await provider.request({ method: "eth_requestAccounts" });
          if (accounts.length > 0) {
            setCurrentAccount(accounts[0]);
            const chainId = await provider.request({ method: "eth_chainId" });
            setNetwork(networks[chainId]);
            if (chainId !== POLYGON_MUMBAI_CHAIN_ID) {
              await switchToPolygonMumbai(provider);
              window.location.reload();
            }
          }
        } catch (error) {
          if (error.code === 4001) {
            console.log("User rejected connection");
          } else {
            console.error(error);
          }
        }
    };

    const checkIfWalletIsConnected = async () => {
       const provider = getMetaMaskProvider();
       if (!provider) {
        console.log("MetaMask is not installed");
        return;
       }
       const accounts = await provider.request({ method: 'eth_accounts' });

       //grab 1st account if we are authorized
       if(accounts.length != 0) {
         const account = accounts[0];
         console.log("Found an authorised account", account);
         setCurrentAccount(account);
       } else {
         console.log("No authorized account found");
       }
    };

    useEffect(() => { // rendered as soon as page loads
     checkIfWalletIsConnected();
    },[]);


  const mintDomain = async () => {
    if (!domain) return;
    if (domain.length < 3) {
      alert("Domain name must be at least 3 characters");
      return;
    }
    try {
      const provider = getMetaMaskProvider();
      if (!provider) return;
      const chainId = await provider.request({ method: "eth_chainId" });
      if (chainId !== POLYGON_MUMBAI_CHAIN_ID) {
        await switchToPolygonMumbai(provider);
        window.location.reload();
        return;
      }
        const ethersProvider = new ethers.providers.Web3Provider(provider);
        const signer = ethersProvider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);
        let price = domain.length == 3 ? '0.5' : domain.length == 4 ? '0.3' : '0.1';
        console.log("Minting your domain",domain, "at price: ", price);

       let txn = await contract.register(domain, {value: ethers.utils.parseEther(price)}); // calls contract's method =>  metamask pops up
       const receipt = await txn.wait(); // waits for the transaction to be mined

       if(receipt.status == 1) {
         console.log("Domain minted successfully!!");
         console.log("https://mumbai.polygonscan.com/tx/"+txn.hash);
         console.log(txn.hash);
       }
       txn = await contract.attachDataToDomain(domain, record);
       await txn.wait();
         console.log("Record set successfully at https://mumbai.polygonscan.com/tx/"+txn.hash);

        // Call fetchMints after 2 seconds
        setTimeout(() => {
          fetchMints();
        }, 1000);
         setDomain('');
         setRecord('');
    } catch (error) {
      console.log(error); 
    }
  }
   
  const updateDomain = async () => {
    if (!record || !domain) { return }

    const recordField = document.querySelector(".record-input");
    setLoading(true);
    console.log("Updating domain", domain, "with record", record);
      try {
        const metaProvider = getMetaMaskProvider();
      if (metaProvider) {
        const provider = new ethers.providers.Web3Provider(metaProvider);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);
  
        let tx = await contract.attachDataToDomain(domain.split(".")[0], record);
        await tx.wait();
        console.log("Record set https://mumbai.polygonscan.com/tx/"+tx.hash);
  
        fetchMints();
        renderMints();
        setRecord('');
        setDomain('');
      }
      } catch(error) {
        console.log(error);
      }
    setLoading(false);
    setEditing(false);
    recordField.value = "";
  }

  const fetchMints = async () => {
     try {
       const metaProvider = getMetaMaskProvider();
       if (metaProvider) {
        const provider = new ethers.providers.Web3Provider(metaProvider);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);

        const names = await contract.getAllNames();

        const mintRecords = await Promise.all(names.map(async(name) => {
          //console.log(name)
          let name1 = name.split(".")[0];
          console.log(name)
          //const mintRecord = await contract.getData(name);
          const mintRecord = await contract.records(name1);
          console.log(mintRecord);
          const owner = await contract.domains(name1);
          //console.log(owner);
          return {
            id: names.indexOf(name),
            name: name,
            record: mintRecord,
            owner: owner,
          };
        }));
        console.log("MINTS FETCHED ", mintRecords);
        setMints(mintRecords);

       }
     } catch (error) {
      console.log(error);
       
     }
  }

  // This will run any time currentAccount or network are changed
  useEffect(() => {
    if (network == 'Polygon Mumbai Testnet') {
      fetchMints();
      renderMints();
    }
  },[currentAccount, network]);
  
    // Add this render function next to your other render functions
const renderMints = () => {
  if (currentAccount && mints.length > 0) {
    return (
      <div className="mint-container">
        <p className="subtitle">Recently minted domains!</p>
        <div className="mint-list">
          { mints.map((mint, index) => {
            return (
              <div className="mint-item" key={index}>
                <div className='mint-row'>
                  <a className="link" href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`} target="_blank" rel="noopener noreferrer">
                    <p className="underlined">{' '}{mint.name}{' '}</p>
                  </a>
                  {/* If mint.owner is currentAccount, add an "edit" button*/}
                  { mint.owner.toLowerCase() == currentAccount.toLowerCase() ?
                    <button className="edit-button" onClick={() => editRecord(mint.name)}>
                      <img className="edit-icon" src="https://img.icons8.com/metro/26/000000/pencil.png" alt="Edit button"/>
                      </button>
                    :
                    null
                  }
                </div>
          <p className="record"> {mint.record} </p>
        </div>
        )
        })}
      </div>
    </div>
    );
  }
};

// This will take us into edit mode and show us the edit buttons!
const editRecord = (name) => {
  console.log("Editing record for", name);
  setEditing(true);
  setDomain(name);
}
    const dashboard = () => {
        return(
        <div className="dashboard-container">
      <div className="container-contents">
        {/* <div className="dashboard-img">
          <img src="https://media4.giphy.com/media/R4UdL9xqUaOMZsRosx/giphy.gif?cid=ecf05e475mwvapr6qs9uz25po3vbtk4r89dd58x3szjzypop&rid=giphy.gif&ct=g"></img>
        </div> */}
        <div className="dashboard-content">
            {!editing ?
          <div className="input-group mb-3 input-area">
           <input
              type="text"
              className="form-control"
              placeholder="Enter Domain Name"
              aria-label="Domain name"
              onChange={e => setDomain(e.target.value)}
            />
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={() => {}}
            >
              {tld}
            </button>
          </div>
            : 
            null
           }
          <div className="input-group mb-3 input-area">
            <input
              type="text"
              className="form-control record-input"
              placeholder="Add a description or link"
              aria-label="Record data"
              onChange={e => setRecord(e.target.value)}
            />
          </div>
          {
             editing ? (
               <div className="button-container">
                    <button type="button" className="btn btn-lg btn-primary" disabled={loading} onClick={updateDomain}>Set Record</button>
                    <button type="button" className="btn btn-secondary btn-lg" onClick={() => { setEditing(false); }}>Cancel</button>
                 </div>
             ):(
            <button type="button" className="btn btn-primary btn-lg" onClick={mintDomain}>
              Mint Domain
            </button>
             )
           }
        </div>
        <div className="recently-minted"> {mints && renderMints()}</div>
      </div>
    </div>
    );
    }

    const landing = () => {
        return (
            <div className="landing-container">
            {/* <div className="landing-components"> */}
            <section id="c1" className="destination-1">
                <div className="component-1">
                    <div className="home-heading">
                     <p className="home-heading-text">
                    <Typewriter
                     options={{autoStart: true,
                        loop: true,
                        delay: 40,
                        typeSpeed: 70,
                        strings:["PRISM NAME SERVICE"]
                    }}
                    />
                    </p>
                       </div>
                        <div className="wallet-connect-btn body-1">
                        <button type="button" className="btn btn-success connect-btn" onClick={connectWallet}>Connect Wallet <i className="fas fa-wallet" /></button>
                    </div>
                </div>
            </section>
            <section id="c2" className="destination-2">
                <div className="component-2">
                    <div className="about-us">
                        <div className="about-us-heading">
                            <h1 className="about-us-heading-text">About Us</h1>
                        </div>
                        <div className="about-us-content">
                            <p className="about-us-para">Prism Name Service (PNS) is a custom domain name service on
                             Polygon.<br/>This is similar to DNS but on blockchain. Our aim is to provide users with 
                             a personal domain name (.prism) just like .eth, .sol etc. But why PNS? <br/> We provide
                             you with unique domain name that nobody else can own. Also, it is present on blockchain
                             so it will be immutable. Thus, you can use your domain name as a personal public API from
                             where others can access data or information about you that you want them to access.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            <section id="c3" className="destination-3">
                <div className="component-3">
                    <div className="steps">
                        <div className="steps-heading">
                            <h1>How To Use</h1>
                        </div>
                        <div className="steps-content">
                            <div className="step-1">
                                <div className="step-1-heading">
                                    <h2><b>1. Connect Wallet <i className="fas fa-link" /></b></h2>
                                </div>
                                <div className="step-1-content">
                                    <p>Click on the <b>Connect Wallet</b> button and connect your wallet by 
                                    selecting the desired account from the popup
                                    </p>
                                </div>
                            </div>
                            <div className="step-1">
                                <div className="step-1-heading">
                                    <h2><b>2. Enter Your Domain <i className="fas fa-keyboard" /></b></h2>
                                </div>
                                <div className="step-1-content">
                                    <p>Enter <b>your domain name</b> in the text area provided and  
                                    click on the <b>create domain</b> button and your NFT will be minted
                                    </p>
                                </div>
                            </div>
                            <div className="step-1">
                                <div className="step-1-heading">
                                    <h2><b>3. View on OpenSea <i className="fas fa-external-link-alt" /></b></h2>
                                </div>
                                <div className="step-1-content">
                                    <p>Click on the <b>domain name generated</b> and it will redirect you 
                                     to your NFT on opensea will all the details you have stored
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            </div>
        )
    }

   return (
    <div>
        {!currentAccount && landing()}
        {currentAccount && dashboard()}
    </div>
  )
}

export default LandingPage