#!/bin/bash

# Redeploy script for Zama testnet migration
# Usage: bash redeploy_after_testnet_migration.sh [network]

set -e

NETWORK=${1:-sepolia}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🔄 Starting redeployment process for network: $NETWORK"
echo "📁 Project root: $PROJECT_ROOT"

# Step 1: Navigate to hardhat directory
cd "$PROJECT_ROOT/hardhat"

echo ""
echo "📦 Step 1: Installing dependencies..."
npm install

# Step 2: Deploy contract
echo ""
echo "📜 Step 2: Deploying contract to $NETWORK..."
npx hardhat run scripts/deploy.ts --network "$NETWORK"

# Step 3: Extract contract address
echo ""
echo "📍 Step 3: Extracting contract address..."
CONTRACT_ADDRESS=$(jq -r '.address' deployments/address.json 2>/dev/null || echo "")

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "❌ Failed to extract contract address"
    exit 1
fi

echo "✅ Contract deployed at: $CONTRACT_ADDRESS"

# Step 4: Update frontend .env
echo ""
echo "🔧 Step 4: Updating frontend .env..."
FRONTEND_ENV="$PROJECT_ROOT/private-ledger-flow/.env"
if [ ! -f "$FRONTEND_ENV" ]; then
    cp "$PROJECT_ROOT/.env.example" "$FRONTEND_ENV"
fi

sed -i.bak "s/VITE_CONTRACT_ADDRESS=.*/VITE_CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" "$FRONTEND_ENV"
rm -f "$FRONTEND_ENV.bak"

# Step 5: Update root .env
echo ""
echo "🔧 Step 5: Updating root .env..."
ROOT_ENV="$PROJECT_ROOT/.env"
if [ ! -f "$ROOT_ENV" ]; then
    cp "$PROJECT_ROOT/.env.example" "$ROOT_ENV"
fi

sed -i.bak "s/VITE_CONTRACT_ADDRESS=.*/VITE_CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" "$ROOT_ENV"
rm -f "$ROOT_ENV.bak"

# Step 6: Restart backend listener
echo ""
echo "🔄 Step 6: Restarting backend listener..."
cd "$PROJECT_ROOT"
if [ -f docker-compose.yml ] && docker compose ps | grep -q tracker-backend; then
    docker compose restart backend
    echo "✅ Backend restarted"
elif systemctl is-active --quiet tracker-backend 2>/dev/null; then
    sudo systemctl restart tracker-backend
    echo "✅ Backend service restarted"
else
    echo "⚠️  Backend not running via docker-compose or systemctl. Please restart manually."
fi

# Step 7: Output summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Redeployment complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Summary:"
echo "  Network: $NETWORK"
echo "  Contract Address: $CONTRACT_ADDRESS"
echo "  Frontend URL: http://localhost:5173"
echo "  Backend URL: http://localhost:3001"
echo "  Explorer: https://sepolia.etherscan.io/address/$CONTRACT_ADDRESS"
echo ""
echo "📝 Next steps:"
echo "  1. Update your .env files with new contract address"
echo "  2. Restart frontend and backend services"
echo "  3. Test end-to-end flow"
echo "  4. Create demo video for Zama community"
echo ""
echo "🎬 Demo URL: http://localhost:5173"
echo "📚 Docs: See docs/migration-checklist.md for more info"
echo ""

# Generate migration entry
MIGRATION_DATE=$(date +%Y-%m-%d)
MIGRATION_ENTRY="
## Migration $MIGRATION_DATE - $NETWORK

- **Date**: $MIGRATION_DATE
- **Network**: $NETWORK
- **Contract Address**: $CONTRACT_ADDRESS
- **Deployer**: $(jq -r '.deployer' "$PROJECT_ROOT/hardhat/deployments/address.json")
- **Reason**: Zama testnet migration
"

echo "$MIGRATION_ENTRY" >> "$PROJECT_ROOT/docs/migrations.md"

echo "✅ Migration entry added to docs/migrations.md"

