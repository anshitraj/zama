# Private Transaction Tracker

## ⚠️ Privacy Disclaimer

**This is a demo application for showcasing Fully Homomorphic Encryption (FHE) concepts. Do not store real personally identifiable information (PII) or production data on this demo. Replace client stubs with Zama FHE SDK for production use.**

## 🚀 Overview

A beautiful, production-ready React application for tracking encrypted expenses using:
- **Zama FHE** (Fully Homomorphic Encryption) for private computation
- **IPFS** for decentralized encrypted data storage
- **Ethereum Sepolia** blockchain for attestation and immutable records
- **RainbowKit + wagmi** for seamless Web3 wallet integration

## ✨ Features

- 🔐 **End-to-end encrypted expenses** with FHE stubs (ready for Zama integration)
- 📊 **Beautiful dashboard** with charts and analytics
- ⛓️ **Blockchain attestation** on Sepolia testnet
- 📦 **IPFS storage** for encrypted data
- 🌍 **i18n support** (English + Punjabi)
- 📱 **PWA-ready** with offline support
- 🎨 **Dark theme** with smooth animations
- ♿ **Accessible** with keyboard navigation and ARIA labels

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS with custom design system
- **Web3**: wagmi + ethers + RainbowKit
- **State**: TanStack Query
- **Charts**: Recharts
- **Storage**: IndexedDB (idb-keyval) for local keys
- **Animations**: Framer Motion
- **i18n**: react-i18next

## 📋 Prerequisites

- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet
- Sepolia testnet ETH ([get from faucet](https://sepoliafaucet.com/))
- Alchemy/Infura RPC URL
- Pinata or nft.storage API key (for IPFS)

## 🏃 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd private-transaction-tracker
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `VITE_SEPOLIA_RPC_URL` - Alchemy or Infura Sepolia RPC
- `VITE_CONTRACT_ADDRESS` - Deployed ConfidentialExpenses contract address
- `VITE_IPFS_API_KEY` - Pinata JWT or nft.storage API key
- `VITE_WALLETCONNECT_PROJECT_ID` - Get from https://cloud.walletconnect.com/
- `VITE_COPROCESSOR_URL` (optional) - FHE coprocessor endpoint

### 3. Deploy Smart Contract

Deploy the `ConfidentialExpenses.sol` contract to Sepolia:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ConfidentialExpenses {
    event ExpenseAttested(
        bytes32 indexed submissionHash,
        string cid,
        address indexed submitter,
        uint256 timestamp
    );

    mapping(bytes32 => bool) public attestations;

    function attestExpense(bytes32 submissionHash, string memory cid) external {
        require(!attestations[submissionHash], "Already attested");
        attestations[submissionHash] = true;
        emit ExpenseAttested(submissionHash, cid, msg.sender, block.timestamp);
    }

    function verifyAttestation(bytes32 submissionHash) external view returns (bool) {
        return attestations[submissionHash];
    }
}
```

Use [Remix](https://remix.ethereum.org/), Hardhat, or Foundry to deploy. Copy the deployed address to your `.env` file.

### 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:8080

## 🔌 Integrating Zama FHE SDK

### Current Status

The application includes **placeholder functions** for FHE operations in `src/lib/fhe.ts`. These stubs simulate encryption/decryption with clear `TODO: REPLACE WITH ZAMA FHE SDK` comments.

### Production Integration Steps

1. **Install Zama fhEVM SDK**

```bash
npm install fhevmjs
```

2. **Replace `encryptExpenseWithFHE` in `src/lib/fhe.ts`**

```typescript
import { createInstance } from 'fhevmjs';

export async function encryptExpenseWithFHE(payload: ExpensePayload): Promise<EncryptedResult> {
  // Create FHE instance for Sepolia
  const instance = await createInstance({ chainId: 11155111 });
  
  // Create encrypted input
  const input = instance.createEncryptedInput(contractAddress, userAddress);
  input.add64(payload.amount);
  
  // Encrypt
  const encrypted = await input.encrypt();
  
  return {
    ciphertextBlob: encrypted.data,
    ciphertextPreviewHash: encrypted.hash,
    publicKey: instance.getPublicKey()
  };
}
```

3. **Update `decryptWithFHE` similarly**

```typescript
export async function decryptWithFHE(
  ciphertextBlob: Uint8Array,
  privateKey: string
): Promise<ExpensePayload> {
  const instance = await createInstance({ chainId: 11155111 });
  const decrypted = await instance.decrypt(contractAddress, ciphertextBlob);
  return JSON.parse(new TextDecoder().decode(decrypted));
}
```

4. **Set up Coprocessor for `computeHomomorphicSum`**

Deploy a backend endpoint (Node.js/Python) that:
- Accepts array of ciphertexts
- Uses Zama FHE SDK to perform homomorphic addition
- Returns encrypted sum

Example pseudo-API:

```typescript
POST /fhe-compute
Body: { operation: 'sum', ciphertexts: [...] }
Response: { encryptedSum: Uint8Array }
```

Update `VITE_COPROCESSOR_URL` in `.env` to your endpoint.

### Zama Documentation

- [fhEVM Docs](https://docs.zama.ai/fhevm)
- [fhevmjs GitHub](https://github.com/zama-ai/fhevmjs)
- [Zama Discord](https://discord.com/invite/fhe-org)

## 🌐 IPFS Integration

### Current Status

Placeholder functions in `src/lib/ipfs.ts` use localStorage as mock storage.

### Production Integration

#### Option 1: Pinata

```bash
npm install @pinata/sdk
```

```typescript
import pinataSDK from '@pinata/sdk';

const pinata = new pinataSDK({ 
  pinataJWTKey: import.meta.env.VITE_IPFS_API_KEY 
});

export async function uploadToIPFS(data: Uint8Array): Promise<string> {
  const result = await pinata.pinFileToIPFS(new Blob([data]));
  return result.IpfsHash;
}
```

#### Option 2: nft.storage

```bash
npm install nft.storage
```

```typescript
import { NFTStorage, File } from 'nft.storage';

const client = new NFTStorage({ 
  token: import.meta.env.VITE_IPFS_API_KEY 
});

export async function uploadToIPFS(data: Uint8Array): Promise<string> {
  const file = new File([data], 'expense.enc');
  const cid = await client.storeBlob(file);
  return cid;
}
```

## 🚀 Deployment

### Option 1: Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard.

### Option 2: Netlify

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

Use `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: GitHub Pages

```bash
npm run build
# Deploy dist/ folder
```

## 📊 Features Deep Dive

### 🎨 Design System

All colors, gradients, and styles are defined in `src/index.css` using HSL semantic tokens:

```css
--primary: 263 70% 60%;  /* Purple */
--accent: 217 91% 60%;   /* Blue */
--gradient-primary: linear-gradient(135deg, ...);
```

Use semantic classes:
```tsx
<Button className="bg-gradient-primary shadow-glow">
```

### 🔐 Key Management

Local encryption keys are stored in IndexedDB using `idb-keyval`. Users can:
- Generate new keypairs
- Export encrypted backups
- Import from backup files
- Derive keys from wallet signatures (TODO)

### 📱 PWA Support

The app includes a basic service worker registration. To enhance:

1. Add `vite-plugin-pwa`:
```bash
npm install -D vite-plugin-pwa
```

2. Update `vite.config.ts`

### 🌍 Internationalization

Add new languages by creating files in `src/i18n/locales/`:

```typescript
// src/i18n/locales/hi.json
{
  "app": {
    "title": "निजी लेनदेन ट्रैकर"
  }
}
```

Update `src/i18n/config.ts` to import the new language.

## 🧪 Testing

### Unit Tests (Vitest)

```bash
npm run test
```

Example test file `src/lib/__tests__/fhe.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { encryptExpenseWithFHE, decryptWithFHE } from '../fhe';

describe('FHE Operations', () => {
  it('should encrypt and decrypt expense', async () => {
    const payload = {
      amount: 100,
      currency: 'USD',
      category: 'food',
      timestamp: Date.now()
    };

    const encrypted = await encryptExpenseWithFHE(payload);
    expect(encrypted.ciphertextBlob).toBeDefined();

    const decrypted = await decryptWithFHE(
      encrypted.ciphertextBlob, 
      'mock_key'
    );
    expect(decrypted.amount).toBe(payload.amount);
  });
});
```

### E2E Tests (Cypress)

```bash
npm run test:e2e
```

## 📹 Demo Video Script

**30-60 second demo for tagging Zama:**

1. Open app, show dark theme UI
2. Click "Connect Wallet" → MetaMask pops up
3. Click "Add Expense" → fill form → submit
4. Show toast: "Encrypting... Uploading to IPFS... Attesting on-chain..."
5. Success! Show new expense card with encrypted amount (••••)
6. Navigate to "Records" → show all attested expenses
7. Click "Decrypt Locally" (show mock decryption)
8. Navigate to "Verify" → paste CID → click Verify → ✅ Verified on Sepolia!

**Tweetable text:**

> Just built a Private Transaction Tracker using @zama_fhe FHE + IPFS + Sepolia! 🔐⛓️  
> Track expenses with complete privacy - amounts never leave encrypted form.  
> Ready for production FHE SDK integration!  
> Demo: [your-demo-url]  
> GitHub: [your-repo-url]  
> #FHE #Web3 #Privacy

**Discord post template:**

> 👋 Hey Zama community!  
>  
> I built a Private Transaction Tracker showcasing FHE concepts:  
> ✅ Encrypted expense tracking  
> ✅ IPFS storage for ciphertexts  
> ✅ Blockchain attestation on Sepolia  
> ✅ Beautiful React UI with RainbowKit  
> ✅ Ready for Zama FHE SDK integration  
>  
> All FHE operations have clear TODO comments and pseudocode for SDK integration.  
>  
> 🔗 Demo: [url]  
> 💻 GitHub: [url]  
> 📹 Video: [url]  
>  
> Looking forward to integrating the real fhEVM SDK! Any feedback welcome!

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Code style guidelines
- Commit message conventions
- Branch strategy
- Pull request process

## 📄 License

MIT License - feel free to use for your own projects!

## 🙏 Credits

Built with:
- [Zama FHE](https://www.zama.ai/)
- [RainbowKit](https://www.rainbowkit.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)

---

## 🐛 Troubleshooting

### Contract not responding

- Ensure you deployed to Sepolia (chain ID 11155111)
- Verify `VITE_CONTRACT_ADDRESS` is correct
- Check you have Sepolia ETH

### IPFS uploads failing

- Check `VITE_IPFS_API_KEY` is valid
- For mock storage, clear localStorage if data is stale

### Build errors

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### TypeScript errors

Check all imports use `@/` alias defined in `vite.config.ts`

## 📞 Support

- **Zama Discord**: https://discord.com/invite/fhe-org
- **Issues**: Open a GitHub issue
- **Docs**: https://docs.zama.ai/
