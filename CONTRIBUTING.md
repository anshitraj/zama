# Contributing to Private Transaction Tracker

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

See `README.md` for initial setup steps.

## Switching to Production FHEVM

Currently, the project uses mock FHE functions for testing. To switch to the real Zama FHEVM:

### 1. Install FHEVM Compiler

```bash
# Install Zama Hardhat plugin
cd hardhat
npm install @fhenix/fhevm-js @fhenix/hardhat-plugin
```

### 2. Update Hardhat Config

Edit `hardhat/hardhat.config.ts`:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@fhenix/hardhat-plugin";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      fhevm: {
        enabled: true, // Enable FHE types
      },
    },
  },
  fhenix: {
    url: "https://api.testnet.fhenix.zone/evm", // Zama testnet
  },
  networks: {
    fhenix: {
      url: "https://api.testnet.fhenix.zone/evm",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};
```

### 3. Update Contract

In `ConfidentialExpenses.sol`, uncomment the FHE version and comment the fallback:

```solidity
contract ConfidentialExpenses {
    mapping(address => string[]) private userCids;
    
    // FHE VERSION (Active when compiling with FHEVM)
    mapping(address => euint64[]) private fheBalances;  // Real FHE type
    
    event ExpenseAttested(address indexed user, bytes32 indexed submissionHash, string cid);
    
    function attestExpense(bytes32 submissionHash, string calldata cid) public {
        userCids[msg.sender].push(cid);
        emit ExpenseAttested(msg.sender, submissionHash, cid);
    }
}
```

### 4. Update Frontend

Replace mock functions in `frontend/src/lib/fhe.ts` with real SDK calls (see `docs/zama-integration.md`).

### 5. Deploy to FHEVM Testnet

```bash
cd hardhat
npx hardhat run scripts/deploy.ts --network fhenix
```

## Creating Testnet Deployment PRs

### PR Template

```markdown
## Deployment Details

**Network**: Fhenix Testnet
**Contract Address**: 0x...
**Transaction Hash**: 0x...
**Block Number**: 12345

## Changes

- Brief summary of changes

## Verification

- [ ] Contract deployed successfully
- [ ] Verified on Fhenix explorer
- [ ] Frontend updated with new address
- [ ] Backend listener restarted
- [ ] Integration tests passed

## Testing

```bash
npm run test:integration
```

## Related Issues

Closes #XXX
```

### Checklist

Before submitting a deployment PR:

1. Run full test suite: `npm test`
2. Deploy to testnet
3. Verify contract on block explorer
4. Update `.env.example` with new address
5. Create migration entry in `docs/migration-checklist.md`
6. Test end-to-end flow
7. Update README if API changed

## Code Style

- Use TypeScript for all new code
- Follow ESLint/Prettier configs
- Write tests for new features
- Document complex functions
- Mark FHE-specific code with `TODO REPLACE WITH ZAMA SDK`

## Adding New Homomorphic Operations

To add a new aggregation operation (e.g., average, max):

1. **Contract**: Add new function in `ConfidentialExpenses.sol`
2. **Backend**: Update `coprocService.ts` with new operation
3. **Frontend**: Add UI component and API call
4. **Docs**: Update `docs/zama-integration.md` with I/O schema
5. **Tests**: Add unit and integration tests

Example:

```typescript
// backend/src/services/coprocService.ts
async function aggregateMax(cids: string[]): Promise<AggregateResult> {
  const ciphertexts = await fetchCiphertexts(cids);
  const response = await callCoprocessor({
    ciphertexts,
    op: 'max',
    targetType: 'euint64',
  });
  return response;
}
```

## Reporting Bugs

Please include:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (network, browser, etc.)
- Error logs
- Screenshots if applicable

## Questions?

- Discord: https://discord.gg/zama
- Issues: GitHub Issues
- Docs: `docs/` folder

