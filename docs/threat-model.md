# Threat Model

## Overview

The Private Transaction Tracker processes encrypted financial data. This document outlines potential threats and mitigation strategies.

## System Components

1. **Frontend**: React app in user's browser
2. **Backend**: Node.js API server
3. **Smart Contract**: Ethereum blockchain (Sepolia/FHEVM)
4. **IPFS**: Distributed storage for encrypted blobs
5. **Coprocessor**: Zama homomorphic computation service

## Threat Categories

### 1. Data Privacy

#### Threat: Plaintext Exposure
**Risk**: High  
**Description**: Unencrypted expense data exposed during storage or transmission.

**Mitigation**:
- Client-side encryption before storage
- HTTPS/TLS for all API calls
- No plaintext storage on backend
- IPFS stores only encrypted blobs
- Blockchain stores only hashes and CIDs

#### Threat: Decryption Key Compromise
**Risk**: Critical  
**Description**: Private keys leaked or stolen.

**Mitigation**:
- Keys never transmitted to server
- Browser-native crypto API
- Optional hardware wallet integration
- Key export/import with warnings
- Local storage encryption

### 2. Network Security

#### Threat: Man-in-the-Middle
**Risk**: Medium  
**Description**: Intercept and modify API requests/responses.

**Mitigation**:
- TLS 1.3 for all connections
- Certificate pinning (optional)
- CSP headers
- Rate limiting

#### Threat: IPFS Gateway Tampering
**Risk**: Low  
**Description**: Malicious gateway modifies ciphertexts.

**Mitigation**:
- Verify CIDs on backend
- Support multiple IPFS gateways
- On-chain CID storage provides immutability

### 3. Smart Contract Risks

#### Threat: Replay Attacks
**Risk**: Medium  
**Description**: Re-submit same expense multiple times.

**Mitigation**:
- `attestedHashes` mapping prevents duplicates
- Event indexing checks submission hash
- Nonce-based submission (future)

#### Threat: Front-Running
**Risk**: Low  
**Description**: Attacker sees pending tx and submits first.

**Mitigation**:
- Equal attestations allowed (just not duplicates)
- No financial incentive for front-running
- Private mempool (future)

### 4. Backend Vulnerabilities

#### Threat: SQL Injection
**Risk**: Low  
**Description**: Malicious input in database queries.

**Mitigation**:
- Prisma ORM (parameterized queries)
- Input validation
- Type checking

#### Threat: Unauthorized Access
**Risk**: Medium  
**Description**: Attackers access API without auth.

**Mitigation**:
- Rate limiting (100 req/15min per IP)
- CORS restrictions
- API key for production
- Future: JWT authentication

### 5. Coprocessor Risks

#### Threat: Malicious Coprocessor
**Risk**: High  
**Description**: Coprocessor returns incorrect results.

**Mitigation**:
- Verify proofs when available
- Compare results with multiple coprocessors
- Log all requests/responses
- Plausibility checks (e.g., sum > 0)

#### Threat: Coprocessor Downtime
**Risk**: Low  
**Description**: Service unavailable, blocking aggregation.

**Mitigation**:
- Graceful degradation to mock mode
- Retry logic with exponential backoff
- Status monitoring

### 6. Frontend Vulnerabilities

#### Threat: XSS (Cross-Site Scripting)
**Risk**: Medium  
**Description**: Injected scripts steal keys or data.

**Mitigation**:
- React's built-in XSS protection
- CSP headers
- Sanitize user input
- Avoid `dangerouslySetInnerHTML`

#### Threat: Supply Chain Attacks
**Risk**: Medium  
**Description**: Malicious npm package steals data.

**Mitigation**:
- Lock file (package-lock.json)
- Dependency scanning (npm audit)
- Minimize dependencies
- Review critical packages

### 7. Privacy Leakage

#### Threat: Metadata Analysis
**Risk**: Medium  
**Description**: Patterns revealed from timestamp/frequency.

**Mitigation**:
- Optional timestamp randomization
- Don't correlate patterns publicly
- Educate users about metadata

#### Threat: Correlation Attacks
**Risk**: Low  
**Description**: Link multiple transactions to same user.

**Mitigation**:
- User addresses are pseudonymous
- No PII stored
- IPFS doesn't log access by default

## Security Best Practices

### For Users

1. Use secure browser
2. Keep browser updated
3. Don't share private keys
4. Verify contract address
5. Check transaction hash on explorer

### For Developers

1. Regular dependency updates
2. Security audits
3. Penetration testing
4. Incident response plan
5. Monitoring and logging

## Compliance Considerations

### GDPR
- **Right to deletion**: Remove attestations on request
- **Data portability**: Export encrypted data
- **Processing basis**: Legitimate interest (finance tracking)

### Privacy by Design
- Encryption by default
- Minimal data collection
- User consent for processing
- Audit logs

## Audit Recommendations

### External Audit Checklist

- [ ] Smart contract security review
- [ ] Frontend security testing
- [ ] Backend penetration testing
- [ ] FHE implementation verification
- [ ] Key management review
- [ ] IPFS integration review
- [ ] Coprocessor integration review
- [ ] Privacy impact assessment

### Ongoing Monitoring

- Error rate tracking
- Unusual API patterns
- Failed transaction analysis
- Coprocessor response validation
- Database backup verification

## Incident Response

### If Private Key Compromised

1. Notify user immediately
2. Disable affected account
3. Revoke old keys
4. Migrate to new keys
5. Document incident

### If Coprocessor Returns Wrong Data

1. Log event
2. Alert users
3. Investigate root cause
4. Deploy fix
5. Verify future requests

### If Contract Bug Found

1. Pause new attestations (if upgradeable)
2. Deploy patched version
3. Migrate existing data
4. Notify users
5. Post mortem

## Known Limitations

1. **Mock FHE**: Currently using placeholders (see integration guide)
2. **No Auth**: No user authentication yet
3. **Centralized Backend**: Single point of failure
4. **Limited Coprocessor Operations**: Only basic aggregations
5. **No Zero-Knowledge Proofs**: Beyond basic encryption

## Future Enhancements

1. Multi-party computation
2. Zero-knowledge proofs
3. Decentralized backend
4. Hardware wallet integration
5. Advanced homomorphic operations
6. Formal verification

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Zama Security Best Practices](https://docs.zama.ai)
- [Ethereum Security Best Practices](https://consensys.github.io/best-practices/)
- [GDPR Compliance Guide](https://gdpr.eu/)

## Contact

- Security issues: security@example.com
- Bug reports: GitHub Issues
- General questions: Zama Discord

---

**Last Updated**: 2024-01-XX  
**Version**: 1.0

