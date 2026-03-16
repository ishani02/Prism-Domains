// EIP-6963: MetaMask rdns identifier
const METAMASK_RDNS = "io.metamask";

function getMetaMaskProviderSync() {
  const ethereum = typeof window !== "undefined" ? window.ethereum : null;
  if (!ethereum) return null;
  if (Array.isArray(ethereum.providers)) {
    const mm = ethereum.providers.find((p) => p.isMetaMask || p?.provider?.isMetaMask);
    if (mm) return mm.provider || mm;
  }
  if (ethereum.isMetaMask) return ethereum;
  return null;
}

// Async: use EIP-6963 to find MetaMask when Temple or others override window.ethereum
function getMetaMaskProviderAsync() {
  return new Promise((resolve) => {
    const tryResolve = (provider) => {
      if (provider) {
        resolve(provider);
        return true;
      }
      return false;
    };

    const sync = getMetaMaskProviderSync();
    if (tryResolve(sync)) return;

    if (typeof window === "undefined" || !window.dispatchEvent) {
      resolve(null);
      return;
    }

    const providers = [];
    const handler = (event) => {
      const { info, provider } = event.detail || {};
      if (provider && (info?.rdns?.includes("metamask") || provider.isMetaMask)) {
        providers.push(provider);
      }
    };
    window.addEventListener("eip6963:announceProvider", handler);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    setTimeout(() => {
      window.removeEventListener("eip6963:announceProvider", handler);
      resolve(providers[0] || getMetaMaskProviderSync() || null);
    }, 300);
  });
}

function getMetaMaskProvider() {
  return getMetaMaskProviderSync();
}

const networks = {
  "0x1": "Mainnet",
  "0x3": "Ropsten",
  "0x2a": "Kovan",
  "0x4": "Rinkeby",
  "0x5": "Goerli",
  "0x61": "BSC Testnet",
  "0x38": "BSC Mainnet",
  "0x89": "Polygon Mainnet",
  "0x13881": "Polygon Mumbai Testnet",
  "0xa86a": "AVAX Mainnet",
};

const POLYGON_MUMBAI_CHAIN_ID = "0x13881";

const polygonMumbaiParams = {
  chainId: POLYGON_MUMBAI_CHAIN_ID,
  chainName: "Polygon Mumbai Testnet",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  rpcUrls: ["https://rpc.ankr.com/polygon_mumbai", "https://polygon-mumbai-bor.publicnode.com"],
  blockExplorerUrls: ["https://mumbai.polygonscan.com"],
};

async function switchToPolygonMumbai(ethereum) {
  try {
    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [polygonMumbaiParams],
    });
    return true;
  } catch (error) {
    console.error("Failed to add/switch to Polygon Mumbai:", error);
    return false;
  }
}

export { networks, switchToPolygonMumbai, POLYGON_MUMBAI_CHAIN_ID, getMetaMaskProvider, getMetaMaskProviderAsync };
