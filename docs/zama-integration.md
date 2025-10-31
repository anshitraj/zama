# Zama FHE Integration Guide

This document provides detailed instructions for replacing mock FHE functions with real Zama SDK calls.

## Overview

The Private Transaction Tracker uses placeholders for FHE operations. This guide shows how to integrate the actual Zama fhEVM SDK.

## Architecture

```
┌──────────────┐
│   Frontend   │
│  (React)     │
│              │
│  FHE Client  │ ──┐
└──────────────┘   │
                   │ 1. Client Encryption
                   ▼
┌─────────────────────────────────────┐
│         Ethereum Network            │
│  (FHEVM-aware Contract)             │
│  - Stores encrypted data            │
│  - Emits attestation events         │
└────────────┬────────────────────────┘
              │
              │ 2. Events
              ▼
┌─────────────────────────────────────┐
│          Backend Service            │
│  - Indexes events                   │
│  - Provides aggregation API         │
└────────────┬────────────────────────┘
              │
              │ 3. Aggregate Request
              ▼
┌─────────────────────────────────────┐
│      Zama Coprocessor               │
│  - Homomorphic computation          │
│  - Returns encrypted result         │
└─────────────────────────────────────┘
```

## Prerequisites

- Node.js >= 18
- TypeScript
- Access to Zama testnet or FHEVM
- Zama SDK credentials (if required)

## Frontend Integration

### Step 1: Install Zama SDK

```bash
cd private-ledger-flow
npm install fhevmjs
```

### Step 2: Update FHE Client

Edit `src/lib/fhe.ts`:

#### A. Import FHEVM

```typescript
import { createInstance } from 'fhevmjs';
```

#### B. Replace `encryptExpenseWithFHE`

**Current (Mock)**:
```typescript
export async function encryptExpenseWithFHE(payload: ExpensePayload): Promise<EncryptedResult> {
  const dataString = JSON.stringify(payload);
  const mockCiphertext = new TextEncoder().encode(dataString);
  const previewHash = keccak256(mockCiphertext);
  const mockPublicKey = '0xMOCK_FHE_PUBLIC_KEY_' + Date.now();
  return { ciphertextBlob: mockCiphertext, ciphertextPreviewHash: previewHash, publicKey: mockPublicKey };
}
```

**Production (Zama SDK)**:
```typescript
export async function encryptExpenseWithFHE(payload: ExpensePayload): Promise<EncryptedResult> {
  const CHAIN_ID = 11155111; // Sepolia or FHEVM chain ID
  const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`;
  
  // Create FHE instance
  const instance = await createInstance({ 
    chainId: CHAIN_ID,
    publicKey: await getFhePublicKey(CONTRACT_ADDRESS) // Cached public key
  });
  
  // Encrypt amount as euint64
  const input = instance.createEncryptedInput(CONTRACT_ADDRESS, userAddress);
  input.add64(payload.amount);
  
  const encrypted = await input.encrypt();
  
  // Also encrypt metadata (category, note) as separate fields
  // Note: FHE typically encrypts numbers. For strings, use hashing or ECIES
  const encryptedMetadata = await encryptMetadata(payload);
  
  return {
    ciphertextBlob: encrypted.data,
    ciphertextPreviewHash: encrypted.hash,
    publicKey: instance.getPublicKey()
  };
}
```

#### C. Replace `decryptWithFHE`

**Production**:
```typescript
export async function decryptWithFHE(ciphertextBlob: Uint8Array, privateKey: string): Promise<ExpensePayload> {
  const CHAIN_ID = 11155111;
  const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`;
  
  const instance = await createInstance({ chainId: CHAIN_ID });
  
  // Decrypt with contract's public key
  const decrypted = await instance.decrypt(CONTRACT_ADDRESS, ciphertextBlob);
  
  return JSON.parse(new TextDecoder().decode(decrypted));
}
```

### Step 3: Update Contract Interface

Edit `src/lib/contract.ts`:

```typescript
export const CONTRACT_ABI = [
  // Existing functions
  parseAbiItem('function attestExpense(bytes32 submissionHash, string cid) external'),
  
  // Add FHE-specific functions if using FHEVM
  parseAbiItem('function getEncryptedBalance() external view returns (euint64)'),
  parseAbiItem('function addExpense(euint64 encryptedAmount, bytes32 categoryHash) external'),
] as const;
```

## Backend Integration

### Step 1: Replace Coprocessor Service

Edit `backend/src/services/coprocService.ts`:

#### A. Add Real Coprocessor Client

```typescript
import axios from 'axios';

const COPROCESSOR_URL = process.env.VITE_COPROCESSOR_URL;
const HMAC_SECRET = process.env.VITE_COPROC_HMAC_KEY;

async function callRealCoprocessor(ciphertexts: string[], op: string): Promise<CoprocessorResponse> {
  const payload = {
    ciphertexts,
    op,
    targetType: 'euint64',
    outputFormat: 'ciphertext',
  };
  
  // Sign request with HMAC
  const signature = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  const response = await axios.post(COPROCESSOR_URL, payload, {
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': signature,
      'X-API-Key': process.env.COPROC_API_KEY, // If required
    },
    timeout: 30000,
  });
  
  return response.data;
}
```

#### B. Coprocessor I/O Schema

**Input Format**:
```json
{
  "ciphertexts": [
    "base64-encoded-ciphertext-1",
    "base64-encoded-ciphertext-2"
  ],
  "op": "sum",
  "targetType": "euint64",
  "outputFormat": "ciphertext"
}
```

**Output Format**:
```json
{
  "resultCiphertext": "base64-encoded-result",
  "proof": "base64-encoded-proof",
  "coprocVersion": "v0.9",
  "meta": {
    "op": "sum",
    "itemsCount": 12,
    "computationTime": 234.5
  }
}
```

### Step 2: Update Event Listener

The backend event listener (`ethListener.ts`) already supports both FHE and non-FHE flows. No changes needed unless using FHE-specific events.

## Smart Contract Integration

### For FHEVM Deployment

1. **Install FHEVM Plugin**:
```bash
cd hardhat
npm install @fhenix/hardhat-plugin
```

2. **Update Hardhat Config**:
```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@fhenix/hardhat-plugin";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      fhevm: {
        enabled: true,
      },
    },
  },
  fhenix: {
    url: "https://api.testnet.fhenix.zone/evm",
  },
  networks: {
    fhenix: {
      url: "https://api.testnet.fhenix.zone/evm",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};
```

3. **Uncomment FHE Code** in `contracts/ConfidentialExpenses.sol`:
```solidity
contract ConfidentialExpenses {
    mapping(address => euint64[]) private fheUserBalances;
    
    function addExpense(bytes32 submissionHash, string calldata cid) public {
        // In FHE version, store encrypted amount
        euint64 encryptedAmount = // Decode from event or parameter
        fheUserBalances[msg.sender].push(encryptedAmount);
        
        emit ExpenseAttested(msg.sender, submissionHash, cid);
    }
}
```

## Testing Integration

### Unit Tests

```typescript
// frontend/src/lib/fhe.test.ts
import { describe, it, expect } from 'vitest';
import { encryptExpenseWithFHE, decryptWithFHE } from './fhe';

describe('FHE Integration', () => {
  it('should encrypt and decrypt expense', async () => {
    const payload = { amount: 100, category: 'food', timestamp: Date.now() };
    const encrypted = await encryptExpenseWithFHE(payload);
    
    expect(encrypted.ciphertextBlob).toBeDefined();
    expect(encrypted.publicKey).toBeDefined();
    
    // Decrypt
    const decrypted = await decryptWithFHE(encrypted.ciphertextBlob, privateKey);
    expect(decrypted.amount).toBe(payload.amount);
  });
});
```

### Integration Tests

```typescript
// backend/src/services/coproc.test.ts
import { describe, it, expect } from 'vitest';
import { coprocService } from './coprocService';

describe('Coprocessor Integration', () => {
  it('should aggregate ciphertexts', async () => {
    const mockCids = ['Qm...', 'Qm...'];
    const result = await coprocService.aggregate(mockCids, 'sum');
    
    expect(result.outputCiphertext).toBeDefined();
    expect(result.meta.itemsCount).toBe(mockCids.length);
  });
});
```

## Security Considerations

1. **Key Management**: Never expose private keys. Use secure storage (browser keystore, hardware wallets).
2. **CIP-192**: Follow Zama's ciphertext format standards.
3. **Rate Limiting**: Implement rate limits on coprocessor calls.
4. **Input Validation**: Validate ciphertexts before processing.
5. **Proof Verification**: Verify coprocessor proofs when available.

## Troubleshooting

### SDK Installation Issues

**Error**: Package not found
```bash
# Check npm registry
npm config get registry

# Use public registry
npm install fhevmjs --registry https://registry.npmjs.org
```

### Coprocessor Connection

**Error**: Connection refused
- Verify `VITE_COPROCESSOR_URL` in `.env`
- Check network firewall
- Ensure coprocessor service is running
- Verify authentication credentials

### FHE Types Not Found

**Error**: `euint64` not recognized
- Install `@fhenix/hardhat-plugin`
- Update `hardhat.config.ts`
- Recompile contracts

## Resources

- [Zama Documentation](https://docs.zama.ai)
- [FHEVM GitHub](https://github.com/zama-ai/fhevm)
- [API Reference](https://docs.zama.ai/fhevm/api)
- [Community Discord](https://discord.gg/zama)
- [Examples Repository](https://github.com/zama-ai/fhevm-examples)

## Migration Checklist

When switching from mock to real FHE:

- [ ] Install fhevmjs
- [ ] Update `encryptExpenseWithFHE` function
- [ ] Update `decryptWithFHE` function
- [ ] Update coprocessor service
- [ ] Deploy to FHEVM testnet
- [ ] Verify encryption/decryption works
- [ ] Test aggregation flow
- [ ] Update documentation
- [ ] Create demo video
- [ ] Submit to Zama community

## Next Steps

1. Read [Zama FHEVM Tutorial](https://docs.zama.ai/fhevm/tutorial)
2. Try example projects in [fhevm-examples](https://github.com/zama-ai/fhevm-examples)
3. Join [Zama Discord](https://discord.gg/zama)
4. Share your integration in community channels

---

**Questions?** Open an issue or ping us in Discord!

