import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { sepolia } from 'viem/chains';
import { CONTRACT_ADDRESS, EXPENSE_ATTESTED_EVENT, SEPOLIA_RPC_URL } from '@/lib/contract';
import type { ExpenseAttestation } from '@/types/expense';

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL),
});

/**
 * Hook to fetch ExpenseAttested events from the blockchain
 */
export function useExpenseEvents() {
  return useQuery({
    queryKey: ['expense-events', CONTRACT_ADDRESS],
    queryFn: async (): Promise<ExpenseAttestation[]> => {
      try {
        // Get logs from the last 100 blocks (free tier limit)
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock - BigInt(100);

        const logs = await publicClient.getLogs({
          address: CONTRACT_ADDRESS,
          event: EXPENSE_ATTESTED_EVENT,
          fromBlock: fromBlock > 0n ? fromBlock : 0n,
          toBlock: 'latest',
        });

        return logs.map(log => ({
          submissionHash: log.args.submissionHash as string,
          cid: log.args.cid as string,
          timestamp: Number(log.args.timestamp),
          submitter: log.args.user as string, // Use 'user' from event args
          txHash: log.transactionHash,
          blockNumber: Number(log.blockNumber),
        }));
      } catch (error) {
        console.warn('Error fetching events (this is normal with no transactions):', error);
        
        // Return empty array instead of mock data to avoid decryption errors
        return [];
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}

/**
 * Hook to verify a specific attestation by submission hash
 */
export function useVerifyAttestation(submissionHash: string | undefined) {
  return useQuery({
    queryKey: ['verify-attestation', submissionHash],
    queryFn: async (): Promise<boolean> => {
      if (!submissionHash) return false;

      try {
        const result = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: [parseAbiItem('function verifyAttestation(bytes32) view returns (bool)')],
          functionName: 'verifyAttestation',
          args: [submissionHash as `0x${string}`],
        } as any);

        return result as boolean;
      } catch (error) {
        console.error('Error verifying attestation:', error);
        return false;
      }
    },
    enabled: !!submissionHash,
  });
}
