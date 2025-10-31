import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Loader2, Plus, Lock, Upload, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { keccak256, toBytes, hexToBytes } from 'viem';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { encryptExpenseWithFHE } from '@/lib/fhe';
import { uploadToIPFS } from '@/lib/ipfs';
import { CONTRACT_ADDRESS, CONTRACT_ABI, computeSubmissionHash } from '@/lib/contract';
import type { Expense } from '@/types/expense';

interface AddExpenseModalProps {
  onSuccess?: (expense: Expense) => void;
}

export function AddExpenseModal({ onSuccess }: AddExpenseModalProps) {
  const { t } = useTranslation();
  const { address } = useAccount();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'encrypting' | 'uploading' | 'attesting'>('form');
  const [pendingExpense, setPendingExpense] = useState<Expense | null>(null);

  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD' as 'INR' | 'USD' | 'EUR',
    category: 'misc' as Expense['category'],
    note: '',
  });

  const { writeContract, data: hash, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, data: receipt } = useWaitForTransactionReceipt({ hash });
  
  // Track when hash becomes available and update pending expense
  // Use refs to prevent duplicate processing and avoid dependency loops
  const hashProcessedRef = useRef<string | null>(null);
  const pendingExpenseRef = useRef<Expense | null>(null);
  
  // Keep ref in sync with state
  useEffect(() => {
    pendingExpenseRef.current = pendingExpense;
  }, [pendingExpense]);
  
  useEffect(() => {
    if (hash && pendingExpenseRef.current && hash !== hashProcessedRef.current) {
      console.log('📝 [CONTRACT] Transaction hash received:', hash);
      hashProcessedRef.current = hash;
      const updatedExpense = { ...pendingExpenseRef.current, txHash: hash };
      setPendingExpense(updatedExpense);
      onSuccess?.(updatedExpense);
    }
  }, [hash]); // Only depend on hash
  
  // Update UI when transaction is confirmed
  const receiptProcessedRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (receipt && receipt.transactionHash !== receiptProcessedRef.current) {
      console.log('✅ [CONTRACT] Transaction confirmed:', receipt.transactionHash);
      receiptProcessedRef.current = receipt.transactionHash;
      toast.success('Transaction confirmed!');
      
      // Use ref to get latest pendingExpense without dependency
      const currentPending = pendingExpenseRef.current;
      if (currentPending && hash === receipt.transactionHash) {
        const confirmedExpense = { 
          ...currentPending, 
          txHash: receipt.transactionHash,
          status: 'attested' as const
        };
        onSuccess?.(confirmedExpense);
      }
      
      // Clear pending expense (refs will be reset when modal closes or new transaction starts)
      setPendingExpense(null);
      
      setStep('form');
      setLoading(false);
      setOpen(false);
    }
  }, [receipt, hash]); // Only depend on receipt and hash

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address) {
      toast.error(t('wallet.connect'));
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    
    // Reset refs for new transaction
    hashProcessedRef.current = null;
    receiptProcessedRef.current = null;

    try {
      // Step 1: Encrypt expense
      setStep('encrypting');
      const payload = {
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        category: formData.category,
        note: formData.note,
        timestamp: Date.now(),
      };

      const { ciphertextBlob, ciphertextPreviewHash } = await encryptExpenseWithFHE(
        payload,
        CONTRACT_ADDRESS,
        address
      );
      toast.success(t('expense.encrypting'));

      // Step 2: Upload to IPFS
      setStep('uploading');
      const cid = await uploadToIPFS(ciphertextBlob);
      toast.success(t('expense.uploading'));

      // Step 3: Compute submission hash
      const submissionHash = computeSubmissionHash(cid);

      // Step 4: Attest on-chain
      setStep('attesting');
      
      // Prepare metadata (empty bytes as hex)
      const txMeta = '0x' as `0x${string}`;
      
      console.log('📝 [CONTRACT] Submitting attestation:', {
        cid,
        submissionHash,
      });
      
      // Call writeContract (fires async, hash comes via hook)
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'attestExpense',
        args: [submissionHash, cid, txMeta],
        gas: BigInt(500000),
      } as any);
      
      toast.success('Transaction submitted! Waiting for confirmation...');
      
      // Create expense object for optimistic UI update (hash will be updated via useEffect)
      const newExpense: Expense = {
        id: Date.now().toString(),
        amount: payload.amount,
        currency: payload.currency,
        category: payload.category,
        note: payload.note,
        timestamp: payload.timestamp,
        cid,
        submissionHash,
        encrypted: true,
        status: 'pending',
        txHash: 'pending', // Will be updated when hash is available
      };

      // Store pending expense, will be updated with hash via useEffect
      setPendingExpense(newExpense);
      
      // Call onSuccess immediately for optimistic update
      onSuccess?.(newExpense);

      // Reset form
      setFormData({
        amount: '',
        currency: 'USD',
        category: 'misc',
        note: '',
      });
      
      setLoading(false);

    } catch (error) {
      console.error('Error submitting expense:', error);
      toast.error(t('expense.error'));
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = () => {
    switch (step) {
      case 'encrypting':
        return <Lock className="h-5 w-5 animate-pulse" />;
      case 'uploading':
        return <Upload className="h-5 w-5 animate-pulse" />;
      case 'attesting':
        return <CheckCircle2 className="h-5 w-5 animate-pulse" />;
      default:
        return <Plus className="h-5 w-5" />;
    }
  };

  const getStepLabel = () => {
    switch (step) {
      case 'encrypting':
        return t('expense.encrypting');
      case 'uploading':
        return t('expense.uploading');
      case 'attesting':
        return t('expense.attesting');
      default:
        return t('expense.submit');
    }
  };

  // Reset refs when modal closes
  useEffect(() => {
    if (!open) {
      hashProcessedRef.current = null;
      receiptProcessedRef.current = null;
      pendingExpenseRef.current = null;
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-20 right-6 md:bottom-6 h-14 w-14 rounded-full bg-gradient-primary shadow-glow hover:scale-105 transition-transform z-40"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t('expense.add')}</DialogTitle>
          <DialogDescription>
            Your expense will be encrypted with FHE and attested on Sepolia
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="amount">{t('expense.amount')}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              disabled={loading}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">{t('expense.currency')}</Label>
              <Select
                value={formData.currency}
                onValueChange={(value: any) => setFormData({ ...formData, currency: value })}
                disabled={loading}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">{t('expense.category')}</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                disabled={loading}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">{t('expense.categories.food')}</SelectItem>
                  <SelectItem value="travel">{t('expense.categories.travel')}</SelectItem>
                  <SelectItem value="salary">{t('expense.categories.salary')}</SelectItem>
                  <SelectItem value="shopping">{t('expense.categories.shopping')}</SelectItem>
                  <SelectItem value="utilities">{t('expense.categories.utilities')}</SelectItem>
                  <SelectItem value="misc">{t('expense.categories.misc')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">{t('expense.note')}</Label>
            <Textarea
              id="note"
              placeholder="Add a note..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              disabled={loading}
              rows={3}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-primary shadow-glow"
            disabled={loading || isConfirming}
            size="lg"
          >
            {loading || isConfirming ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {getStepLabel()}
              </>
            ) : (
              <>
                {getStepIcon()}
                <span className="ml-2">{getStepLabel()}</span>
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
