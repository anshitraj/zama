export interface Expense {
  id: string;
  amount: number;
  currency: 'INR' | 'USD' | 'EUR';
  category: 'food' | 'travel' | 'salary' | 'misc' | 'shopping' | 'utilities';
  note?: string;
  timestamp: number;
  cid?: string;
  txHash?: string;
  submissionHash?: string;
  encrypted: boolean;
  status: 'pending' | 'attested' | 'failed';
}

export interface EncryptedExpensePayload {
  ciphertextBlob: Uint8Array;
  ciphertextPreviewHash: string;
  publicKey: string;
}

export interface ExpenseAttestation {
  submissionHash: string;
  cid: string;
  timestamp: number;
  submitter: string;
  txHash: string;
  blockNumber: number;
}

export interface AggregatedTotal {
  total: number;
  count: number;
  lastUpdated: number;
  isEncrypted: boolean;
}
