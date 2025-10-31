# Zama Testnet Migration Checklist

> **Important**: Zama testnet resets may cause state loss. This guide helps you redeploy and reconfigure.

## Overview

When Zama testnet migrates or resets:
1. Contract state is lost
2. All attested expenses are erased
3. Contract addresses change
4. Frontend/backend must reconnect to new addresses

## Pre-Migration Preparation

- [ ] Document current contract address
- [ ] Backup any important test data
- [ ] Note current deployment configuration
- [ ] Verify testnet status updates from Zama

## Automated Redeployment

Run the automated redeploy script:

```bash
bash infra/scripts/redeploy_after_testnet_migration.sh sepolia
```

### What the Script Does

1. **Deploys New Contract**: Deploys `ConfidentialExpenses` to target network
2. **Updates Environment Files**: Updates `.env` files with new contract address
3. **Restarts Services**: Restarts backend listener to pick up new address
4. **Generates Migration Entry**: Records migration in `docs/migrations.md`

### Manual Steps (If Needed)

If the script fails or you prefer manual steps:

#### 1. Deploy Contract

```bash
cd hardhat
npx hardhat run scripts/deploy.ts --network sepolia
```

Copy the deployed address.

#### 2. Update Environment Variables

Edit `.env` files:

```bash
# .env
VITE_CONTRACT_ADDRESS=0x...  # New address

# private-ledger-flow/.env
VITE_CONTRACT_ADDRESS=0x...  # New address

# backend/.env (if separate)
VITE_CONTRACT_ADDRESS=0x...  # New address
```

#### 3. Restart Services

**Using Docker Compose:**
```bash
docker-compose -f infra/docker-compose.yml restart backend
```

**Using systemd:**
```bash
sudo systemctl restart tracker-backend
```

**Manual restart:**
```bash
cd backend
npm start
```

#### 4. Verify Connection

- Frontend loads without errors
- Backend listener connects to new contract
- Can submit test attestation
- Events are indexed

## Post-Migration Verification

- [ ] Contract verified on block explorer
- [ ] Frontend connects to new contract
- [ ] Backend listener is running
- [ ] Can submit test expense
- [ ] IPFS upload works
- [ ] Coprocessor integration functional
- [ ] End-to-end flow tested

## Testing Checklist

```bash
# 1. Check contract deployment
curl http://localhost:3001/api/health

# 2. Submit test expense via frontend
# Visit http://localhost:5173

# 3. Check backend indexing
curl http://localhost:3001/api/records

# 4. Verify on explorer
# https://sepolia.etherscan.io/address/[CONTRACT_ADDRESS]
```

## Important Notes

### Testnet vs Mainnet

**Sepolia (Standard EVM)**:
- Uses fallback contract (no FHE types)
- Faster deployment
- Good for UI/UX testing
- Free testnet ETH

**Zama Testnet (FHEVM)**:
- Requires FHEVM compiler
- Supports homomorphic operations
- Production-like environment
- Contract verification differs

### Contract Versions

The `ConfidentialExpenses.sol` contract includes:

1. **FHE Version**: Commented, uses `euint64` types
2. **Fallback Version**: Active, works on standard EVM

To switch:
1. Uncomment FHE code in contract
2. Install `@fhenix/hardhat-plugin`
3. Update `hardhat.config.ts`
4. Deploy to FHEVM testnet

See `CONTRIBUTING.md` for details.

## Resources

- [Zama Docs](https://docs.zama.ai)
- [FHEVM GitHub](https://github.com/zama-ai/fhevm)
- [Testnet Status](https://docs.zama.ai/testnet)
- [Migration Log](migrations.md)

## Troubleshooting

### Contract Deployment Fails

**Error**: Insufficient funds
```bash
# Get testnet ETH from faucet
# Sepolia: https://sepoliafaucet.com
```

**Error**: Network not found
```bash
# Check hardhat.config.ts network configuration
# Verify RPC URL in .env
```

### Backend Not Indexing

**Symptoms**: Events not appearing in DB

**Solutions**:
1. Check backend logs: `docker-compose logs backend`
2. Verify contract address is correct
3. Ensure listener is running
4. Check RPC connection: `curl $VITE_SEPOLIA_RPC_URL`

### Frontend Can't Connect

**Symptoms**: Contract calls fail

**Solutions**:
1. Clear browser cache
2. Verify `.env` is loaded (check browser console)
3. Confirm wallet is connected to correct network
4. Check wagmi configuration

## Support

- Discord: [Zama Community](https://discord.gg/zama)
- GitHub Issues: File bug reports
- Documentation: `docs/` folder

## Related Files

- `infra/scripts/redeploy_after_testnet_migration.sh`: Automated redeploy
- `docs/migrations.md`: Migration history
- `docs/zama-integration.md`: FHE integration guide
- `CONTRIBUTING.md`: Development setup

