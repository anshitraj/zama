import axios from "axios";
import { ipfsService } from "./ipfsService";
import * as crypto from "crypto";

const COPROCESSOR_URL = process.env.COPROCESSOR_URL || process.env.VITE_COPROCESSOR_URL || "";
const HMAC_SECRET = process.env.COPROC_HMAC_KEY || process.env.VITE_COPROC_HMAC_KEY || "demo-secret";

interface CoprocessorRequest {
  ciphertexts: string[];
  op: string;
  targetType: string;
  outputFormat?: string;
}

interface CoprocessorResponse {
  resultCiphertext: string;
  proof?: string;
  coprocVersion: string;
  meta: {
    op: string;
    itemsCount: number;
  };
}

interface AggregateResult {
  outputCiphertext: string;
  meta: {
    op: string;
    itemsCount: number;
    coprocessorVersion: string;
  };
}

class CoprocessorService {
  /**
   * Call the mock coprocessor (for demo)
   * TODO: Replace with real Zama coprocessor call
   */
  private async callMockCoprocessor(
    ciphertexts: string[],
    op: string
  ): Promise<CoprocessorResponse> {
    console.log("🔥 Using MOCK coprocessor for demonstration");
    
    // MOCK: Simulate FHE decryption and aggregation
    // In production, this would be done homomorphically without decryption
    
    const mockAmounts = ciphertexts.map((_, i) => Math.floor(Math.random() * 1000) + 10);
    
    let result: number;
    switch (op) {
      case "sum":
        result = mockAmounts.reduce((a, b) => a + b, 0);
        break;
      case "max":
        result = Math.max(...mockAmounts);
        break;
      case "min":
        result = Math.min(...mockAmounts);
        break;
      case "avg":
        result = Math.floor(mockAmounts.reduce((a, b) => a + b, 0) / mockAmounts.length);
        break;
      default:
        result = mockAmounts.reduce((a, b) => a + b, 0);
    }
    
    // Return mock encrypted result
    const mockResultCiphertext = Buffer.from(JSON.stringify({ value: result, type: "euint64" }))
      .toString("base64");
    
    return {
      resultCiphertext: mockResultCiphertext,
      coprocVersion: "v0.9-mock",
      meta: {
        op,
        itemsCount: ciphertexts.length,
      },
    };
  }
  
  /**
   * Call real Zama coprocessor
   * TODO: Implement actual endpoint call
   */
  private async callRealCoprocessor(
    ciphertexts: string[],
    op: string
  ): Promise<CoprocessorResponse> {
    if (!COPROCESSOR_URL) {
      console.warn("⚠️ COPROCESSOR_URL not set, using mock");
      return this.callMockCoprocessor(ciphertexts, op);
    }
    
    const payload: CoprocessorRequest = {
      ciphertexts,
      op,
      targetType: "euint64",
      outputFormat: "ciphertext",
    };
    
    // Sign request with HMAC
    const signature = crypto
      .createHmac("sha256", HMAC_SECRET)
      .update(JSON.stringify(payload))
      .digest("hex");
    
    try {
      const response = await axios.post(COPROCESSOR_URL, payload, {
        headers: {
          "Content-Type": "application/json",
          "X-Signature": signature,
        },
        timeout: 30000,
      });
      
      return response.data;
    } catch (error: any) {
      console.error("Real coprocessor error:", error);
      console.log("Falling back to mock coprocessor");
      return this.callMockCoprocessor(ciphertexts, op);
    }
  }
  
  /**
   * Aggregate ciphertexts using coprocessor
   */
  async aggregate(cids: string[], op: string): Promise<AggregateResult> {
    try {
      // Fetch ciphertexts from IPFS
      console.log(`📦 Fetching ${cids.length} ciphertexts from IPFS...`);
      
      const ciphertexts = await Promise.all(
        cids.map((cid) => ipfsService.retrieve(cid))
      );
      
      // Call coprocessor
      const response = await this.callRealCoprocessor(ciphertexts, op);
      
      return {
        outputCiphertext: response.resultCiphertext,
        meta: {
          op,
          itemsCount: cids.length,
          coprocessorVersion: response.coprocVersion,
        },
      };
    } catch (error: any) {
      console.error("Aggregation error:", error);
      throw new Error(`Coprocessor aggregation failed: ${error.message}`);
    }
  }
  
  /**
   * Health check for coprocessor
   */
  async healthCheck(): Promise<any> {
    try {
      const testResponse = await this.callMockCoprocessor(["test"], "sum");
      return {
        success: true,
        status: "mock",
        version: testResponse.coprocVersion,
        message: "Using mock coprocessor for demo",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export const coprocService = new CoprocessorService();

