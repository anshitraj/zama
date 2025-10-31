import { useQuery } from '@tanstack/react-query';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface BackendRecord {
  id: number;
  userAddress: string;
  cid: string;
  submissionHash: string;
  txHash: string;
  blockNumber: string | null;
  timestamp: string;
  category: string | null;
  note: string | null;
  status: string;
}

/**
 * Hook to fetch expense records from backend API
 * This is more reliable than direct blockchain queries with free-tier RPC
 */
export function useBackendRecords() {
  return useQuery({
    queryKey: ['backend-records'],
    queryFn: async (): Promise<BackendRecord[]> => {
      try {
        console.log('📡 Fetching backend records from:', `${BACKEND_URL}/api/records`);
        const response = await fetch(`${BACKEND_URL}/api/records?limit=50`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-cache',
        });
        
        if (!response.ok) {
          console.error('Backend responded with status:', response.status);
          throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📦 Backend records received:', result.count, 'records');
        
        if (result.success && result.records) {
          return result.records;
        }
        
        return [];
      } catch (error) {
        console.error('❌ Error fetching backend records:', error);
        return [];
      }
    },
    refetchOnWindowFocus: false, // Prevent refetch on focus
    refetchOnMount: true, // Always fetch on mount
    refetchOnReconnect: true, // Refetch when network reconnects
    retry: 2, // Retry twice on failure
    retryDelay: 1000, // Wait 1 second between retries
  });
}

