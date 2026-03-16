import React from 'react'
// import {Link} from 'react-router-dom';
import "../styles/NavBar.css";
import { useState, useEffect } from 'react';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {BrowserRouter} from "react-router-dom";
import { networks, switchToPolygonMumbai, getMetaMaskProvider, getMetaMaskProviderAsync } from '../utils/networks';
import {HashLink as Link} from "react-router-hash-link";
import polygonLogo from "./assets/polygonlogo.png";
import ethLogo from "./assets/ethlogo.png";
import logo from "./assets/prism-logo.png";
import Scroll from 'react-scroll';

function NavBar() {
  const ethereum = getMetaMaskProvider();
    const [currentAccount, setCurrentAccount] = useState('');
    const [network, setNetwork] = useState('');
    
    const connectWallet = async (requestAccounts = false) => {
        try {
          const provider = requestAccounts ? await getMetaMaskProviderAsync() : getMetaMaskProvider();
          if (!provider) {
            alert("MetaMask is required. Please install it from https://metamask.io/");
            return;
          }
          const method = requestAccounts ? "eth_requestAccounts" : "eth_accounts";
          const accounts = await provider.request({ method });
          
          if (accounts.length > 0) {
            const chainId = await provider.request({ method: "eth_chainId" });
            setNetwork(networks[chainId] || "Unknown");
            setCurrentAccount(accounts[0]);
          }
        } catch (error) {
          if (error.code === 4001) {
            console.log("User rejected connection");
          } else {
            console.error(error);
          }
        }
    };

    const handleSwitchNetwork = async () => {
      const provider = getMetaMaskProvider();
      if (!provider) return;
      try {
        await switchToPolygonMumbai(provider);
        window.location.reload();
      } catch (error) {
        if (error.code === 4001) {
          console.log("User rejected network switch");
        } else {
          alert("Failed to switch network. Please add Polygon Mumbai in MetaMask.");
        }
      }
    };

    useEffect(() => {
      const provider = getMetaMaskProvider();
      if (provider) {
        connectWallet(false);
        provider.on("chainChanged", () => window.location.reload());
        provider.on("accountsChanged", (accounts) => {
          if (accounts.length > 0) {
            setCurrentAccount(accounts[0]);
            provider.request({ method: "eth_chainId" }).then((chainId) => setNetwork(networks[chainId] || ""));
          } else {
            setCurrentAccount("");
            setNetwork("");
          }
        });
      }
    }, []);

    const newNav = () => {
      return (
        <div className='navbar-container'> 
        <div className='links'>
        <nav>
        <div className='site-logo-div'>
          <img className='site-logo' src={logo}/>
          </div>
              <div className="right wallet">
      <img alt="Network logo" className="logo" src={ network.includes("Polygon") ? polygonLogo : ethLogo} />
      { network === 'Polygon Mumbai Testnet' ? (
        <p>Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)}</p>
      ) : (
        <button type="button" className="switch-network-btn" onClick={handleSwitchNetwork}>
          Switch to Polygon Mumbai
        </button>
      ) }
    </div>
      </nav>  
    </div>
    </div>
   );
}

   const nav = () => {
     return(
      <div className='navbar-container'> 
      <div className='links'>
      <nav>
            <div className='site-logo-div'>
          <img className='site-logo' src={logo}/>
          </div>
          <ul>   
            <BrowserRouter>
              <li><Link smooth to="#c1" className="nav-link"><i className="fas fa-home" /> Home</Link></li>
              <li><Link smooth to="#c2" className="nav-link"><i className="fas fa-info-circle" /> About Us</Link></li>
              <li><Link smooth to="#c3" className="nav-link"><i className="fas fa-file-alt" /> Steps</Link></li>
            </BrowserRouter>
            <li>
              <button type="button" className="nav-connect-btn" onClick={() => connectWallet(true)}>
                <i className="fas fa-wallet" /> Connect Wallet
              </button>
            </li>
          </ul>
      </nav>  
    </div>
    </div>
     )
     }

    const selectNav = () => {
      if(currentAccount) {
        return(
         newNav()
        )
      } else {
        return(
        nav()
        )
      }
    }

  return (
      <div>
        {selectNav()}
      </div>    
  )
}

export default NavBar