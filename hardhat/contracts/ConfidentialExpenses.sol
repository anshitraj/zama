// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ConfidentialExpenses
 * @notice On-chain attestation contract for encrypted expenses
 * 
 * This contract provides TWO VERSIONS:
 * 1. FHE Version (commented, for Zama FHEVM deployment)
 * 2. Fallback Version (active, for standard EVM testing on Sepolia)
 * 
 * IMPORTANT: Uncomment FHE types when compiling with Zama FHEVM compiler
 */

contract ConfidentialExpenses {
    
    // ============================================
    // FHE VERSION (DISABLED - Uncomment for Zama FHEVM)
    // ============================================
    
    // FHE-specific types (require Zama FHEVM compiler):
    // 
    // import { ebool, euint8, euint16, euint32, euint64 } from "@zama-ai/fhevm-js";
    // 
    // mapping(address => euint64[]) private fheUserBalances;
    // mapping(address => bytes[]) private fhePublicKeys;
    
    // ============================================
    // FALLBACK VERSION (ACTIVE - Works on standard EVM)
    // ============================================
    
    // Storage for user attestations
    mapping(address => string[]) private userCids;
    mapping(bytes32 => bool) private attestedHashes;
    
    // Event emitted on expense attestation
    event ExpenseAttested(
        address indexed user,
        bytes32 indexed submissionHash,
        string cid,
        uint256 timestamp,
        bytes txMeta
    );
    
    // Optional: Public key registration for encrypted keyflow
    event PublicKeyRegistered(address indexed user, bytes publicKey);
    
    /**
     * @notice Attest an expense by storing CID and emitting event
     * @param submissionHash keccak256 hash of the expense metadata
     * @param cid IPFS CID of the encrypted expense blob
     * @param txMeta Optional metadata (signer, encrypted data)
     * 
     * TODO: When using Zama FHEVM, this function should:
     * 1. Accept encrypted amount as euint64 parameter
     * 2. Store in fheUserBalances mapping
     * 3. Perform homomorphic operations if needed
     */
    function attestExpense(
        bytes32 submissionHash,
        string calldata cid,
        bytes calldata txMeta
    ) public {
        require(!attestedHashes[submissionHash], "Already attested");
        
        userCids[msg.sender].push(cid);
        attestedHashes[submissionHash] = true;
        
        emit ExpenseAttested(
            msg.sender,
            submissionHash,
            cid,
            block.timestamp,
            txMeta
        );
    }
    
    /**
     * @notice Register public key for encrypted operations
     * @param publicKey User's FHE public key (bytes)
     * 
     * TODO: When using Zama FHEVM, store in fhePublicKeys mapping
     */
    function registerPublicKey(bytes calldata publicKey) public {
        // In FHE version: fhePublicKeys[msg.sender] = publicKey;
        emit PublicKeyRegistered(msg.sender, publicKey);
    }
    
    /**
     * @notice Get all CIDs for a user
     * @param user User address
     * @return Array of IPFS CIDs
     */
    function getUserCids(address user) public view returns (string[] memory) {
        return userCids[user];
    }
    
    /**
     * @notice Check if a hash has been attested
     * @param submissionHash Hash to check
     * @return True if attested
     */
    function isAttested(bytes32 submissionHash) public view returns (bool) {
        return attestedHashes[submissionHash];
    }
    
    /**
     * @notice Get total attestations for a user
     */
    function getUserAttestationCount(address user) public view returns (uint256) {
        return userCids[user].length;
    }
    
    // ============================================
    // FUTURE FHE FUNCTIONS (for coprocessor integration)
    // ============================================
    
    /**
     * @dev In FHE version, this would return encrypted balance
     * Returns ciphertext that can be aggregated via coprocessor
     * 
     * function getUserEncryptedBalance(address user) public view returns (euint64) {
     *     return fheUserBalances[user];
     * }
     */
}

