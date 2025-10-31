/**
 * IPFS Upload/Download Stub Implementation
 * 
 * TODO: REPLACE WITH REAL IPFS PROVIDER (Pinata, nft.storage, Web3.Storage)
 * 
 * This file contains placeholder functions for IPFS operations.
 * 
 * For Pinata:
 * npm install @pinata/sdk
 * 
 * Example Pinata Implementation:
 * ```typescript
 * import pinataSDK from '@pinata/sdk';
 * const pinata = new pinataSDK({ pinataJWTKey: process.env.VITE_IPFS_API_KEY });
 * 
 * export async function uploadToIPFS(data: Uint8Array): Promise<string> {
 *   const result = await pinata.pinFileToIPFS(new Blob([data]));
 *   return result.IpfsHash;
 * }
 * ```
 * 
 * For nft.storage:
 * npm install nft.storage
 * 
 * Example nft.storage Implementation:
 * ```typescript
 * import { NFTStorage, File } from 'nft.storage';
 * const client = new NFTStorage({ token: process.env.VITE_IPFS_API_KEY });
 * 
 * export async function uploadToIPFS(data: Uint8Array): Promise<string> {
 *   const file = new File([data], 'expense.enc');
 *   const cid = await client.storeBlob(file);
 *   return cid;
 * }
 * ```
 */

const IPFS_GATEWAY = import.meta.env.VITE_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

/**
 * Upload ciphertext to IPFS via backend
 * Backend handles nft.storage/Pinata integration
 */
export async function uploadToIPFS(data: Uint8Array): Promise<string> {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
  const UPLOAD_URL = `${BACKEND_URL}/api/ipfs/upload`;

  try {
    // Convert to base64
    const base64 = btoa(String.fromCharCode(...data));
    
    // Call backend upload endpoint
    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ciphertext: base64 }),
    });

    const result = await response.json();
    
    if (result.success && result.cid) {
      console.log('📦 [IPFS] Uploaded via Pinata:', {
        cid: result.cid,
        size: data.length,
        provider: 'Pinata'
      });
      
      // Cache in localStorage for mock retrieval if needed
      try {
        localStorage.setItem(`ipfs_${result.cid}`, JSON.stringify(Array.from(data)));
      } catch (e) {
        console.warn('LocalStorage cache failed:', e);
      }
      
      return result.cid;
    }
    
    throw new Error('Upload failed');
  } catch (error) {
    console.error('Backend upload failed, using mock:', error);
    
    // Fallback: Mock CID for demo/testing
    const timestamp = Date.now();
    const mockCid = `QmMockDemo${timestamp}${Math.random().toString(36).substring(2, 9)}`;
    
    console.log('📦 [IPFS MOCK] Generated mock CID:', {
      cid: mockCid,
      size: data.length,
      note: 'Using mock for demo - will work for testing'
    });
    
    try {
      localStorage.setItem(`ipfs_${mockCid}`, JSON.stringify(Array.from(data)));
    } catch (e) {
      console.warn('LocalStorage mock storage failed:', e);
    }
    
    return mockCid;
  }
}

/**
 * Download ciphertext from IPFS via backend or gateway
 */
export async function downloadFromIPFS(cid: string): Promise<Uint8Array> {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
  const BACKEND_RETRIEVE_URL = `${BACKEND_URL}/api/ipfs/${cid}`;

  try {
    // Try backend first
    const response = await fetch(BACKEND_RETRIEVE_URL);
    const result = await response.json();
    
    if (result.success && result.data) {
      console.log('📥 [IPFS] Retrieved via backend:', {
        cid,
        encrypted: result.encrypted,
        dataType: typeof result.data,
        dataLength: result.data?.length,
        dataPreview: result.data?.substring(0, 100)
      });
      
      const decoded = atob(result.data);
      const uint8Array = new Uint8Array(decoded.split('').map(c => c.charCodeAt(0)));
      
      console.log('📥 [IPFS] Decoded to Uint8Array:', {
        length: uint8Array.length,
        firstBytes: Array.from(uint8Array.slice(0, 20))
      });
      
      return uint8Array;
    }
  } catch (error) {
    console.warn('Backend retrieval failed, trying gateway:', error);
  }

  // Fallback 1: Try localStorage cache
  try {
    const stored = localStorage.getItem(`ipfs_${cid}`);
    if (stored) {
      const dataArray = JSON.parse(stored);
      return new Uint8Array(dataArray);
    }
  } catch (e) {
    console.warn('LocalStorage cache retrieval failed:', e);
  }

  // Fallback 2: Try IPFS gateway
  try {
    const response = await fetch(`${IPFS_GATEWAY}${cid}`);
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    }
  } catch (error) {
    console.warn('IPFS gateway fetch failed:', error);
  }
  
  throw new Error(`CID not found: ${cid}`);
}

/**
 * Helper: Get IPFS gateway URL for a CID
 */
export function getIPFSUrl(cid: string): string {
  return `${IPFS_GATEWAY}${cid}`;
}

/**
 * Utility: Check if CID is valid format
 */
export function isValidCID(cid: string): boolean {
  // Basic CID validation (v0 and v1)
  return /^Qm[1-9A-HJ-NP-Za-km-z]{44,}$/.test(cid) || /^b[A-Za-z2-7]{58,}$/.test(cid);
}
