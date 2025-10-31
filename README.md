# Private Transaction Tracker (Encrypted Expense Dashboard)

A fully-private expense tracking dApp that uses Zama Fully Homomorphic Encryption (FHE) to enable private on-chain attestations and homomorphic aggregation without revealing any transaction details.

## 🎯 Overview

This application demonstrates a complete FHE-integrated dApp pipeline:
- **Client-side encryption** of expense data using FHE concepts
- **IPFS storage** for encrypted transaction blobs
- **On-chain attestations** with encrypted metadata
- **Homomorphic aggregation** via Zama coprocessor
- **Zero-knowledge querying** of encrypted totals

## 🏗️ Architecture

```
┌─────────────┐     FHE Encrypt      ┌──────────┐
│   Frontend  │ ────────────────────> │   IPFS   │
│  (React +   │                       │  Storage │
│   wagmi)    │                       └──────────┘
└──────┬──────┘                              │
       │ attestExpense()                     │
       │ (submissionHash, cid)               │
       ▼                                     │
┌─────────────────────────────────────────────────┐
│         ConfidentialExpenses.sol                │
│         (FHE-aware Contract)                    │
└─────┬───────────────────────────────────────────┘
      │
      │ Events: ExpenseAttested
      ▼
┌─────────────┐        ┌─────────────────┐
│   Backend   │ <────> │   Coprocessor   │
│  (Express + │        │  (Homomorphic   │
│  Listener)  │        │   Aggregation)  │
└─────────────┘        └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- A Sepolia ETH wallet with testnet ETH
- MetaMask browser extension
- Alchemy account (free tier) for Sepolia RPC
- IPFS service: Pinata OR NFT.Storage (both free)

### 1. Clone & Install

```bash
git clone <this-repo>
cd tracker
npm install

# Install sub-projects
cd hardhat && npm install && cd ..
cd backend && npm install && cd ..
cd private-ledger-flow && npm install && cd ..
```

### 2. Get API Keys

**Get Alchemy Sepolia RPC:**
1. Go to https://alchemy.com
2. Create app → Select "Sepolia" network
3. Copy HTTP URL

**Get IPFS Keys (Choose One):**

**Option A: Pinata**
1. Go to https://pinata.cloud
2. Create account → API Keys
3. Create key with **Files: Write** and **Gateways: Read** permissions
4. Copy API Key and Secret

**Option B: NFT.Storage (FREE & RELIABLE)**
1. Go to https://nft.storage
2. Create account → API Keys
3. Copy the full JWT token (starts with `eyJ...`)

### 3. Configure Environment

**Root `.env`:**
```env
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
VITE_IPFS_API_KEY=your_ipfs_key_here
IPFS_GATEWAY_URL=https://gateway.pinata.cloud/ipfs
```

**`hardhat/.env`:**
```env
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_wallet_private_key_here
```

**`backend/.env`:**
```env
DATABASE_URL=file:./dev.db
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
VITE_IPFS_API_KEY=your_ipfs_key_here
IPFS_API_SECRET=your_pinata_secret_here  # Only for Pinata
IPFS_GATEWAY_URL=https://gateway.pinata.cloud/ipfs
USE_NFT_STORAGE=false  # Set to true for NFT.Storage
```

**`private-ledger-flow/.env`:**
```env
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
VITE_IPFS_API_KEY=your_ipfs_key_here
VITE_BACKEND_URL=http://localhost:3001
```

### 4. Deploy Contract

```bash
cd hardhat
npx hardhat run scripts/deploy.ts --network sepolia
# Copy the deployed address to all .env files as:
# VITE_CONTRACT_ADDRESS=0x...
cd ..
```

### 5. Start Backend

```bash
cd backend
# First time only:
npx prisma generate
npx prisma migrate dev

# Run:
npm run dev
```

### 6. Start Frontend

```bash
cd private-ledger-flow
npm run dev
```

Visit `http://localhost:5173`

**Now you're ready! Connect wallet and submit an expense!** 🎉

## 📁 Project Structure

```
/
├─ README.md                          # This file
├─ .env.example                       # Environment template
├─ package.json                       # Root orchestrator
├─ hardhat/                           # Hardhat project
│  ├─ contracts/
│  │  └─ ConfidentialExpenses.sol    # FHE contract
│  ├─ scripts/
│  │  ├─ deploy.ts                   # Deploy script
│  │  └─ verify.ts                   # Verify script
│  ├─ test/
│  └─ hardhat.config.ts
├─ backend/                           # Node.js backend
│  ├─ src/
│  │  ├─ server.ts                   # Entry point
│  │  ├─ app.ts                      # Express setup
│  │  ├─ routes/                     # API routes
│  │  ├─ services/                   # Business logic
│  │  └─ db/                         # Database schema
│  └─ Dockerfile
├─ frontend/                          # React frontend
│  ├─ src/
│  │  ├─ lib/
│  │  │  ├─ fhe.ts                   # FHE wrapper
│  │  │  ├─ ipfs.ts                  # IPFS client
│  │  │  └─ contract.ts              # Contract bindings
│  │  ├─ pages/                      # Pages
│  │  └─ components/                 # Components
│  └─ vite.config.ts
├─ infra/
│  ├─ docker-compose.yml             # Local dev stack
│  └─ scripts/
│     └─ redeploy_after_testnet_migration.sh
└─ docs/
   ├─ migration-checklist.md         # Testnet migration guide
   └─ zama-integration.md            # FHE integration guide
```

## 🔐 FHE Integration

### Current State

The project uses **mock FHE functions** that simulate the encryption and aggregation flow. All FHE-specific code is marked with `TODO REPLACE WITH ZAMA SDK`.

### Replacing with Zama SDK

See `docs/zama-integration.md` for detailed integration steps. Quick overview:

1. **Install Zama SDK**:
   ```bash
   npm install @zama-ai/fhevm-js
   ```

2. **Update `frontend/src/lib/fhe.ts`**:
   ```typescript
   // Replace mock with:
   import { FHE } from '@zama-ai/fhevm-js';
   
   export async function encryptExpenseWithFHE(payload: ExpensePayload): Promise<EncryptedExpense> {
     const ciphertext = await FHE.encrypt(payload.amount, {
       publicKey: await getPublicKey(),
       dataType: 'euint64'
     });
     return { ciphertext: Buffer.from(ciphertext).toString('base64') };
   }
   ```

3. **Update Coprocessor calls** in `backend/src/services/coprocService.ts`

### Expected Coprocessor I/O

See `docs/zama-integration.md` section "Coprocessor I/O Schema"

## 🧪 Testing

### Run Unit Tests

```bash
# Hardhat
cd hardhat && npm test

# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

### Integration Test

```bash
npm run test:integration
```

## 🌊 Testing on Sepolia

The contract includes a **fallback mode** that works on standard EVM chains (Sepolia) without the Zama FHE compiler. This allows full end-to-end testing of the frontend and backend.

**Fallback Mode Features:**
- Stores plain attestations with metadata
- Emits standard events
- No FHE computation

**To Enable Fallback:**
- Deploy with `--network sepolia` (standard Hardhat config)
- Use contract address in frontend `.env`

## 📊 Demo Flow

1. **User submits expense**:
   - Frontend encrypts: `{ amount: 100, category: "food" }`
   - Uploads encrypted blob to IPFS (CID: `Qm...`)
   - Calls contract: `attestExpense(keccak256(cid), cid)`

2. **Backend indexes**:
   - Listens for `ExpenseAttested` event
   - Stores record in DB
   - CID queued for aggregation

3. **Aggregation query**:
   - Frontend calls `/api/aggregate`
   - Backend fetches ciphertexts from IPFS
   - Sends to coprocessor (mock or real)
   - Returns encrypted total

## 🌐 Deployment

### Frontend (Vercel)

```bash
cd frontend
vercel --prod
```

### Backend (Heroku/Railway)

```bash
cd backend
heroku create tracker-backend
git push heroku main
```

### Smart Contract

```bash
cd hardhat
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## 🔄 Testnet Migration

Zama testnet resets require contract redeployment. See:
- `docs/migration-checklist.md`
- `infra/scripts/redeploy_after_testnet_migration.sh`

Run automated redeploy:
```bash
bash infra/scripts/redeploy_after_testnet_migration.sh sepolia
```

## 🤝 Zama Community Programs

This project is designed to qualify for Zama Creator/Developer programs.

### Proof Artifacts Required

1. **Repository**: Public GitHub repo with full source
2. **Demo Video**: 2-3 minute walkthrough showing:
   - Privacy-preserving expense submission
   - Encrypted aggregation query
   - Smart contract interaction
3. **Technical Documentation**: `docs/zama-integration.md`
4. **Threat Model**: See `docs/threat-model.md`
5. **Working Demo URL**: Live deployment (e.g., Vercel + Heroku)

### Submission Checklist

- [ ] Repo is public and well-documented
- [ ] Demo video uploaded (YouTube/Loom)
- [ ] Integration guide shows FHE SDK usage
- [ ] Testnet deployment verified
- [ ] Community announcement posted

### Community Post Template

```
🚀 Just built a private expense tracker with @zama_ai FHE!

✅ Zero-knowledge attestations
✅ Homomorphic aggregation
✅ IPFS storage

Live demo: <your-url>
Code: <github-link>

#FHE #Privacy #Web3 #Zama
```

## 📝 Contributing

See `CONTRIBUTING.md` for:
- How to switch to production FHEVM compiler
- Creating testnet deployment PRs
- Adding new homomorphic operations

## 🔒 Security & Privacy

**Important Notes:**
- Do NOT store plaintext PII on backend
- Use demo/fake data only
- Implement proper CSP headers
- Rate limiting enabled
- Input validation on all endpoints

### Key Storage

- Frontend uses Web Crypto + idb-keyval
- Export/import functionality provided
- Keys never leave client

## 📚 Additional Resources

- [Zama Documentation](https://docs.zama.ai)
- [Zama Discord](https://discord.gg/zama)
- [FHEVM GitHub](https://github.com/zama-ai/fhevm)

## 📄 License

MIT

## 🙏 Acknowledgments

Built for the Zama community with ❤️

