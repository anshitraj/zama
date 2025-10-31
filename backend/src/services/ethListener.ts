import { ethers } from "ethers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ABI for ConfidentialExpenses contract
const CONTRACT_ABI = [
  "event ExpenseAttested(address indexed user, bytes32 indexed submissionHash, string cid, uint256 timestamp, bytes txMeta)",
  "function attestExpense(bytes32 submissionHash, string calldata cid, bytes calldata txMeta) external",
  "function isAttested(bytes32 submissionHash) external view returns (bool)",
];

interface ListenerState {
  running: boolean;
  provider: ethers.Provider | null;
  contract: ethers.Contract | null;
}

const state: ListenerState = {
  running: false,
  provider: null,
  contract: null,
};

class EthListener {
  /**
   * Start listening to contract events
   */
  async start() {
    if (state.running) {
      console.log("⚠️ Listener already running");
      return;
    }
    
    const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.VITE_SEPOLIA_RPC_URL;
    const contractAddress = process.env.CONTRACT_ADDRESS || process.env.VITE_CONTRACT_ADDRESS;
    
    if (!rpcUrl || !contractAddress) {
      console.error("❌ Missing RPC_URL or CONTRACT_ADDRESS in environment");
      return;
    }
    
    try {
      state.provider = new ethers.JsonRpcProvider(rpcUrl);
      
      if (!state.provider) {
        throw new Error('Failed to create provider');
      }
      
      state.contract = new ethers.Contract(contractAddress, CONTRACT_ABI, state.provider);
      
      // Subscribe to events
      state.contract.on("ExpenseAttested", async (
        user: string,
        submissionHash: string,
        cid: string,
        timestamp: bigint,
        txMeta: string
      ) => {
        await this.handleExpenseAttested(user, submissionHash, cid, timestamp, txMeta);
      });
      
      state.running = true;
      console.log(`✅ Ethereum listener started on contract ${contractAddress}`);
      
      // Process recent events (last 10 blocks for free tier)
      await this.processRecentEvents();
      console.log(`📊 Historical events processed (last 10 blocks)`);
      
    } catch (error: any) {
      console.error("❌ Failed to start listener:", error.message);
    }
  }
  
  /**
   * Handle ExpenseAttested event
   */
  private async handleExpenseAttested(
    user: string,
    submissionHash: string,
    cid: string,
    timestamp: bigint,
    txMeta: string
  ) {
    try {
      // Store in database (skip txHash lookup for now due to free tier limits)
      await prisma.expense.upsert({
        where: { cid },
        create: {
          userAddress: user.toLowerCase(),
          cid,
          submissionHash,
          txHash: "pending", // Will be updated when available
          blockNumber: null,
          timestamp: new Date(Number(timestamp) * 1000),
          status: "confirmed",
        },
        update: {
          status: "confirmed",
        },
      });
      
      console.log(`✅ Indexed expense: ${cid} from ${user}`);
    } catch (error: any) {
      console.error("Error handling event:", error.message);
    }
  }
  
  /**
   * Get transaction hash for event
   */
  private async getEventTxHash(submissionHash: string): Promise<string | null> {
    try {
      // Query recent blocks to find the event (10 block limit for free tier)
      const currentBlock = await state.provider!.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10);
      
      const events = await state.contract!.queryFilter(
        state.contract!.filters.ExpenseAttested(null, submissionHash),
        fromBlock,
        currentBlock
      );
      
      return events[0]?.hash || null;
    } catch {
      return null;
    }
  }
  
  /**
   * Get block number for event
   */
  private async getEventBlockNumber(submissionHash: string): Promise<number | null> {
    try {
      const currentBlock = await state.provider!.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10); // Free tier limit
      
      const events = await state.contract!.queryFilter(
        state.contract!.filters.ExpenseAttested(null, submissionHash),
        fromBlock,
        currentBlock
      );
      
      return events[0]?.blockNumber || null;
    } catch {
      return null;
    }
  }
  
  /**
   * Process recent events (last 10 blocks for free tier)
   */
  private async processRecentEvents() {
    try {
      const currentBlock = await state.provider!.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10); // Free tier limit
      
      console.log(`📊 Processing events from blocks ${fromBlock} to ${currentBlock} (free tier: 10 blocks)`);
      
      const events = await state.contract!.queryFilter(
        state.contract!.filters.ExpenseAttested(),
        fromBlock,
        currentBlock
      );
      
      console.log(`Found ${events.length} events to process`);
      
      for (const event of events) {
        const { user, submissionHash, cid, timestamp, txMeta } = event.args as any;
        await this.handleExpenseAttested(user, submissionHash, cid, timestamp, txMeta);
      }
    } catch (error: any) {
      console.error("Error processing recent events:", error);
    }
  }
  
  /**
   * Stop listener
   */
  stop() {
    if (state.running && state.contract) {
      state.contract.removeAllListeners();
      state.running = false;
      console.log("🛑 Ethereum listener stopped");
    }
  }
}

export const ethListener = new EthListener();

