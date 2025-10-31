# Migration Log

This file records all testnet migrations and contract deployments.

## Migration 2024-XX-XX - Sepolia (Template)

- **Date**: 2024-XX-XX
- **Network**: Sepolia
- **Contract Address**: 0x...
- **Deployer**: 0x...
- **Reason**: Initial deployment / Zama testnet migration
- **Notes**: Fallback contract for standard EVM testing

## How to Add Entry

Entries are automatically added by the redeploy script:

```bash
bash infra/scripts/redeploy_after_testnet_migration.sh sepolia
```

Manual entry format:

```markdown
## Migration YYYY-MM-DD - Network Name

- **Date**: YYYY-MM-DD
- **Network**: Network Name
- **Contract Address**: 0x...
- **Deployer**: 0x...
- **Reason**: Brief reason
- **Notes**: Additional context
```

## Testnet Change Log References

- [Zama Testnet Status](https://docs.zama.ai/testnet)
- See also: `migration-checklist.md`

