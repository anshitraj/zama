import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FileText, Filter } from 'lucide-react';
import { ExpenseCard } from '@/components/ExpenseCard';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBackendRecords } from '@/hooks/useBackendRecords';
import { decryptWithFHE } from '@/lib/fhe';
import { downloadFromIPFS } from '@/lib/ipfs';
import { toast } from 'sonner';
import type { Expense } from '@/types/expense';

export default function Records() {
  const { t } = useTranslation();
  const { data: backendRecords = [], isLoading, error } = useBackendRecords();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const expenses: Expense[] = backendRecords.map(record => ({
    id: record.cid,
    amount: 0,
    currency: 'USD',
    category: (record.category as Expense['category']) || 'misc',
    timestamp: new Date(record.timestamp).getTime(),
    cid: record.cid,
    txHash: record.txHash,
    submissionHash: record.submissionHash,
    encrypted: true,
    status: record.status === 'confirmed' ? 'attested' : 'pending',
  }));

  const filteredExpenses = categoryFilter === 'all'
    ? expenses
    : expenses.filter(e => e.category === categoryFilter);

  const handleDecrypt = async (expense: Expense) => {
    if (!expense.cid) return;

    // Check if it's a mock CID (handle various mock formats)
    if (expense.cid.includes('Mock') || expense.cid.includes('QmMock') || expense.cid.includes('QmYwAPJzv5CZsnAMockCID')) {
      toast.error('Cannot decrypt demo data. Submit a real expense to test decryption.');
      return;
    }

    try {
      toast.info('Decrypting expense...');
      
      // Download from IPFS
      const ciphertext = await downloadFromIPFS(expense.cid);
      
      // ========== STEP 1: DEBUG RAW PAYLOAD FROM IPFS ==========
      console.log('>>> raw payload (full):', ciphertext);
      console.log('>>> typeof:', typeof ciphertext);
      console.log('>>> Array.isArray:', Array.isArray(ciphertext));
      console.log('>>> instanceof Uint8Array:', ciphertext instanceof Uint8Array);
      console.log('>>> Buffer.isBuffer:', typeof Buffer !== 'undefined' && Buffer.isBuffer(ciphertext));
      console.log('>>> length:', ciphertext?.length);
      
      if (ciphertext && typeof ciphertext === 'object') {
        console.log('>>> keys:', Object.keys(ciphertext));
        if (Array.isArray(ciphertext)) {
          console.log('>>> first element preview:', JSON.stringify(ciphertext.slice(0, 20)));
          console.log('>>> array length:', ciphertext.length);
        } else if (ciphertext instanceof Uint8Array) {
          console.log('>>> Uint8Array preview (first 20 bytes):', Array.from(ciphertext.slice(0, 20)));
        }
      }
      
      // ========== STEP 2: QUICK LOCAL POLICY - SKIP IF EMPTY ==========
      if (ciphertext == null) {
        console.warn('>>> Payload is null/undefined - skipping decrypt');
        toast.warning('No encrypted data found (payload is null)');
        if (expense.amount && expense.amount > 0) {
          toast.success(`Using stored data: $${expense.amount} ${expense.currency}`);
        }
        return;
      }
      
      if (Array.isArray(ciphertext) && ciphertext.length === 0) {
        console.warn('>>> Payload is empty array [] - skipping decrypt');
        toast.warning('No encrypted data found (empty array)');
        if (expense.amount && expense.amount > 0) {
          toast.success(`Using stored data: $${expense.amount} ${expense.currency}`);
        }
        return;
      }
      
      if (ciphertext instanceof Uint8Array && ciphertext.length === 0) {
        console.warn('>>> Payload is empty Uint8Array - skipping decrypt');
        toast.warning('No encrypted data found (empty Uint8Array)');
        if (expense.amount && expense.amount > 0) {
          toast.success(`Using stored data: $${expense.amount} ${expense.currency}`);
        }
        return;
      }
      
      if (typeof ciphertext === 'object' && Object.keys(ciphertext).length === 0) {
        console.warn('>>> Payload is empty object {} - skipping decrypt');
        toast.warning('No encrypted data found (empty object)');
        if (expense.amount && expense.amount > 0) {
          toast.success(`Using stored data: $${expense.amount} ${expense.currency}`);
        }
        return;
      }
      
      // ========== STEP 3: DECODE AND INSPECT IF IT'S A STRING/BLOB ==========
      // If it's a Uint8Array, try to decode it as JSON to see what's inside
      if (ciphertext instanceof Uint8Array && ciphertext.length > 0) {
        try {
          const decodedString = new TextDecoder().decode(ciphertext);
          console.log('>>> Decoded string preview (first 200 chars):', decodedString.substring(0, 200));
          
          // Try to parse as JSON to see structure
          try {
            const parsed = JSON.parse(decodedString);
            console.log('>>> Parsed JSON structure:', {
              keys: Object.keys(parsed),
              hasEncryptedAmount: !!parsed.encryptedAmount,
              hasMetadata: !!parsed.metadata,
              hasData: !!parsed.data,
              hasCiphertext: !!parsed.ciphertext,
              preview: JSON.stringify(parsed).substring(0, 200)
            });
          } catch (e) {
            console.log('>>> Not valid JSON, raw bytes');
          }
        } catch (e) {
          console.log('>>> Could not decode as UTF-8 string');
        }
      }
      
      // Decrypt with Zama FHE SDK (pass expense as fallback)
      const decrypted = await decryptWithFHE(ciphertext, undefined, {
        amount: expense.amount,
        currency: expense.currency,
        category: expense.category,
        note: expense.note,
        timestamp: expense.timestamp
      });
      
      toast.success(`Decrypted: $${decrypted.amount} ${decrypted.currency}`);
    } catch (error: any) {
      console.error('Decryption error:', error);
      
      // Handle NoCiphertext case gracefully - use expense object's amount if available
      if (error.code === 'NoCiphertext') {
        console.warn('No ciphertext for this record. Using expense object data instead.', error.payloadPreview);
        
        // If expense object has amount, use it (from optimistic update or backend)
        if (expense.amount && expense.amount > 0) {
          toast.success(`Using stored data: $${expense.amount} ${expense.currency}`);
          return;
        }
        
        // Otherwise show warning
        toast.warning('No encrypted data found for this expense. It may be a legacy record.');
        return;
      }
      
      // For other errors, try using expense object's amount as fallback
      if (expense.amount && expense.amount > 0) {
        console.warn('Decryption failed, but expense object has amount. Using stored data.');
        toast.success(`Using stored data: $${expense.amount} ${expense.currency}`);
        return;
      }
      
      toast.error(`Failed to decrypt expense: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('records.title')}
          </h1>
          <p className="text-muted-foreground">
            View all attested expenses on the blockchain
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder={t('records.filterCategory')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('records.allCategories')}</SelectItem>
              <SelectItem value="food">{t('expense.categories.food')}</SelectItem>
              <SelectItem value="travel">{t('expense.categories.travel')}</SelectItem>
              <SelectItem value="salary">{t('expense.categories.salary')}</SelectItem>
              <SelectItem value="shopping">{t('expense.categories.shopping')}</SelectItem>
              <SelectItem value="utilities">{t('expense.categories.utilities')}</SelectItem>
              <SelectItem value="misc">{t('expense.categories.misc')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Records List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading records...</div>
          </div>
        ) : error ? (
          <EmptyState
            icon={FileText}
            title="Error loading records"
            description="Failed to fetch records from backend. Please check your connection."
          />
        ) : filteredExpenses.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t('records.noRecords')}
            description="No attested expenses found with the selected filters"
          />
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                showDecrypt
                onDecrypt={() => handleDecrypt(expense)}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
