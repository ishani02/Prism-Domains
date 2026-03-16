# Prism Name Service (.prism domains on Polygon)

**Prism Name Service** is a decentralized domain name service built on Polygon. Users can connect their EVM wallet (e.g. MetaMask), mint unique **.prism** domain NFTs, attach a short description or link (record) stored on-chain, and see recently minted domains with links to view them on OpenSea. It’s similar in spirit to ENS but focused on **.prism** domains on Polygon Mumbai testnet.

---

## Tech stack

- **Smart contracts:** Solidity, OpenZeppelin, Hardhat  
- **Blockchain / network:** Polygon Mumbai (testnet)  
- **Frontend:** React (Create React App), Bootstrap, custom CSS  
- **Web3:** ethers.js  
- **Wallets:** MetaMask (EIP-1193 provider); logic prefers MetaMask when multiple wallets are installed  

---

## Project structure

```
shine-name-service/
├── contracts/           # Solidity smart contracts
│   ├── Domains.sol      # Main Prism Name Service contract (ERC-721, register, attachDataToDomain, etc.)
│   └── libraries/       # Base64, StringUtils
├── scripts/             # Hardhat scripts
│   └── deploy.js        # Deploys Domains with TLD "prism"
├── test/                # Hardhat tests
├── frontend/            # React dapp
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js
│       ├── components/
│       │   ├── NavBar.js      # Nav, Connect Wallet, network/wallet display
│       │   ├── LandingPage.js # Hero, About, How-to, mint form, recently minted list
│       │   ├── Dashboard.js
│       │   └── assets/        # Logo, network icons
│       ├── styles/            # NavBar, LandingPage, Dashboard CSS
│       └── utils/
│           ├── networks.js    # Chain IDs, MetaMask provider, Polygon Mumbai RPC
│           └── contractABI.json
├── hardhat.config.js
└── package.json
```

---

## How it works (workflow)

**On-chain:**  
`Domains.sol` is deployed with a TLD (e.g. `"prism"`). Users call `register(name)` with MATIC; the contract mints an ERC-721 NFT for `<name>.prism`, with pricing by length (3 chars = 0.5, 4 = 0.3, 5+ = 0.1 MATIC). Owners can call `attachDataToDomain(name, data)` to set record text. `getAllNames()` returns all registered domains.

**Frontend flow:**  
1. **Connect wallet** — User clicks “Connect Wallet”; app detects MetaMask, calls `eth_requestAccounts`, and if not on Polygon Mumbai, prompts to add/switch to Mumbai (with a chosen RPC).  
2. **Mint .prism domain** — User enters domain name and optional record; app ensures Mumbai, then calls `register(name)` with the right MATIC value and, on success, `attachDataToDomain(name, record)`.  
3. **View minted domains** — App fetches `getAllNames()` and record/owner data and shows a “Recently minted” list; each domain links to OpenSea (testnet). Owners can edit their domain’s record.

---

## Prerequisites

- **Node.js** (LTS) and **npm**
- **MetaMask** (or compatible EVM wallet)
- **Polygon Mumbai** added in MetaMask
- **Test MATIC** on Mumbai (e.g. from a faucet) for gas

---

## Setup & run

### 1. Install root (Hardhat) dependencies

```bash
npm install
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install --legacy-peer-deps
```

### 3. Run the app

**Option A – Use existing Polygon Mumbai deployment**  
Ensure `CONTRACT_ADDRESS` in `frontend/src/components/LandingPage.js` (and `Dashboard.js` if used) matches your deployed contract. Then:

```bash
cd frontend
npm start
```

Open `http://localhost:3000`, connect MetaMask, switch to Polygon Mumbai if prompted, and mint.

**Option B – Local Hardhat node**  
In one terminal:

```bash
npx hardhat node
```

In another (from repo root):

```bash
npx hardhat run scripts/deploy.js --network localhost
```

Copy the deployed contract address into `LandingPage.js` → `CONTRACT_ADDRESS`. Then:

```bash
cd frontend
npm start
```

Add MetaMask network: `http://127.0.0.1:8545`, chain ID `31337`, and use a test account from the Hardhat node.

**Option C – Deploy to Polygon Mumbai**  
Set `mumbai` in `hardhat.config.js` (RPC URL, private key). Then:

```bash
npx hardhat run scripts/deploy.js --network mumbai
```

Update `CONTRACT_ADDRESS` in the frontend and run `npm start` in `frontend/`.

---

## Scripts

**Hardhat (from repo root):**

- `npx hardhat compile` — Compile contracts  
- `npx hardhat test` — Run tests  
- `npx hardhat node` — Start local node  
- `npx hardhat run scripts/deploy.js --network <network>` — Deploy  

**Frontend (from `frontend/`):**

- `npm start` — Dev server  
- `npm run build` — Production build  

