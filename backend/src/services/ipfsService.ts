import axios from "axios";
import FormData from "form-data";

const PINATA_API_KEY = process.env.PINATA_API_KEY || process.env.VITE_IPFS_API_KEY || "";
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY || process.env.IPFS_API_SECRET || "";
const IPFS_GATEWAY_URL = process.env.IPFS_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs";

class IPFSService {
  /**
   * Upload ciphertext to IPFS using Pinata
   */
  async upload(ciphertext: string): Promise<string> {
    try {
      if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
        console.warn("⚠️ Pinata API keys not configured, using mock CID");
        return this.getMockCid();
      }
      
      // Convert base64 to Buffer
      const buffer = Buffer.from(ciphertext, "base64");
      
      const cid = await this.uploadToPinata(buffer);
      console.log(`✅ Uploaded to Pinata: ${cid}`);
      return cid;
      
    } catch (error: any) {
      console.error("IPFS upload error:", error.message);
      console.warn("⚠️ Using mock CID for demo/testing");
      return this.getMockCid();
    }
  }
  
  /**
   * Generate mock CID for demo/testing
   */
  private getMockCid(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `QmMockDemo${timestamp}${random}`;
  }
  
  /**
   * Upload to Pinata
   */
  private async uploadToPinata(buffer: Buffer): Promise<string> {
    const formData = new FormData();
    
    // Create a temporary file-like stream
    formData.append("file", buffer, {
      filename: "encrypted-expense.blob",
      contentType: "application/octet-stream",
    });
    
    // Optional: Add metadata
    const metadata = JSON.stringify({
      name: "encrypted-expense",
      keyvalues: {
        type: "fhe-expense",
        timestamp: Date.now().toString(),
      },
    });
    formData.append("pinataMetadata", metadata);
    
    try {
      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            "pinata_api_key": PINATA_API_KEY,
            "pinata_secret_api_key": PINATA_SECRET_API_KEY,
            ...formData.getHeaders(),
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );
      
      if (!response.data.IpfsHash) {
        throw new Error("No CID returned from Pinata");
      }
      
      return response.data.IpfsHash;
    } catch (error: any) {
      if (error.response) {
        console.error("Pinata error response:", error.response.data);
        throw new Error(`Pinata upload failed: ${error.response.data?.error?.details || error.response.data?.error || error.message}`);
      }
      throw error;
    }
  }
  
  /**
   * Retrieve content from IPFS via Pinata gateway
   * Returns base64-encoded ciphertext
   */
  async retrieve(cid: string): Promise<string> {
    // Skip if it's a test/mock CID
    if (cid.includes("Mock") || cid === "QmYwAPJzv5CZsnAMockCID12345") {
      throw new Error("Mock CID detected - skipping");
    }
    
    try {
      const url = `${IPFS_GATEWAY_URL}/${cid}`;
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 10000,
      });
      
      const buffer = Buffer.from(response.data);
      return buffer.toString("base64");
    } catch (error: any) {
      // Only log if not 429 (rate limit) or 400 (invalid CID)
      if (error.response?.status !== 429 && error.response?.status !== 400) {
        console.error("IPFS retrieval error:", error.message);
      }
      throw new Error(`IPFS retrieval failed: ${error.message}`);
    }
  }
  
  /**
   * Check IPFS gateway health
   */
  async healthCheck(): Promise<boolean> {
    try {
      await axios.get(`${IPFS_GATEWAY_URL}/QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o`, {
        timeout: 5000,
      });
      return true;
    } catch {
      return false;
    }
  }
}

export const ipfsService = new IPFSService();

