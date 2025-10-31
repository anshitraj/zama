import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ShieldCheck, Search, CheckCircle2, XCircle, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { computeSubmissionHash, getSepoliaExplorerUrl } from '@/lib/contract';
import { getIPFSUrl, isValidCID } from '@/lib/ipfs';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface ProofData {
  cid: string;
  submissionHash: string;
  txHash: string;
  blockNumber: string | null;
  timestamp: string;
  userAddress: string;
  category: string | null;
}

export default function Verify() {
  const { t } = useTranslation();
  const { cid: paramCid } = useParams();
  const [inputCid, setInputCid] = useState(paramCid || '');
  const [submissionHash, setSubmissionHash] = useState<string | undefined>();
  const [proofData, setProofData] = useState<ProofData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (paramCid) {
      setInputCid(paramCid);
      handleVerify(paramCid);
    }
  }, [paramCid]);

  const handleVerify = async (cidToVerify?: string) => {
    const cid = cidToVerify || inputCid;
    
    if (!cid) {
      toast.error('Please enter a CID');
      return;
    }

    if (!isValidCID(cid)) {
      toast.error('Invalid CID format');
      return;
    }

    setIsLoading(true);
    setIsVerified(null);
    setProofData(null);

    try {
      // Compute submission hash
      const hash = computeSubmissionHash(cid);
      setSubmissionHash(hash);

      // Fetch proof from backend
      const response = await fetch(`${BACKEND_URL}/api/proof/${cid}`);
      const result = await response.json();

      if (result.success && result.proof) {
        setIsVerified(true);
        setProofData(result.proof);
        toast.success('Attestation verified!');
      } else {
        setIsVerified(false);
        toast.error('Attestation not found');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setIsVerified(false);
      toast.error('Failed to verify attestation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 shadow-glow">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('verify.title')}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('verify.explanation')}
          </p>
        </div>

        {/* Verification Form */}
        <Card className="mb-8 border-border/50 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Enter IPFS CID</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Qm... or b..."
                value={inputCid}
                onChange={(e) => setInputCid(e.target.value)}
                className="font-mono"
              />
              <Button
                onClick={() => handleVerify()}
                disabled={!inputCid || isLoading}
                className="bg-gradient-primary"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    {t('verify.verify')}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Verification Result */}
        {(submissionHash || proofData) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-border/50 bg-card/80 backdrop-blur">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  {isLoading ? (
                    <div>
                      <div className="flex justify-center mb-4">
                        <Loader2 className="h-16 w-16 text-primary animate-spin" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Verifying...</h3>
                      <p className="text-muted-foreground">
                        Checking attestation on blockchain
                      </p>
                    </div>
                  ) : isVerified ? (
                    <div>
                      <div className="flex justify-center mb-4">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-green-500 mb-2">
                        {t('verify.verified')}
                      </h3>
                      <p className="text-muted-foreground">
                        This expense has been attested on the Sepolia blockchain
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-center mb-4">
                        <XCircle className="h-16 w-16 text-destructive" />
                      </div>
                      <h3 className="text-2xl font-bold text-destructive mb-2">
                        {t('verify.notVerified')}
                      </h3>
                      <p className="text-muted-foreground">
                        No attestation found for this CID
                      </p>
                    </div>
                  )}
                </div>

                {/* Details */}
                {proofData && (
                  <div className="space-y-4 border-t border-border/30 pt-6">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">IPFS CID</div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono break-all">
                          {proofData.cid}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(getIPFSUrl(proofData.cid), '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Submission Hash</div>
                      <code className="block rounded bg-muted px-3 py-2 text-sm font-mono break-all">
                        {proofData.submissionHash}
                      </code>
                    </div>

                    {proofData.txHash && proofData.txHash !== 'pending' && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Transaction Hash</div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono break-all">
                            {proofData.txHash}
                          </code>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => window.open(getSepoliaExplorerUrl(proofData.txHash), '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {proofData.blockNumber && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Block Number</div>
                        <code className="block rounded bg-muted px-3 py-2 text-sm font-mono">
                          {proofData.blockNumber}
                        </code>
                      </div>
                    )}

                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Timestamp</div>
                      <code className="block rounded bg-muted px-3 py-2 text-sm">
                        {new Date(proofData.timestamp).toLocaleString()}
                      </code>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-1">User Address</div>
                      <code className="block rounded bg-muted px-3 py-2 text-sm font-mono break-all">
                        {proofData.userAddress}
                      </code>
                    </div>

                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        How Verification Works
                      </h4>
                      <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>CID is hashed using keccak256 to create submission hash</li>
                        <li>Backend checks database for matching attestation record</li>
                        <li>Record confirms the expense was attested on Sepolia blockchain</li>
                      </ol>
                    </div>
                  </div>
                )}

                {!proofData && submissionHash && (
                  <div className="space-y-4 border-t border-border/30 pt-6">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">IPFS CID</div>
                      <code className="block rounded bg-muted px-3 py-2 text-sm font-mono break-all">
                        {inputCid}
                      </code>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Submission Hash</div>
                      <code className="block rounded bg-muted px-3 py-2 text-sm font-mono break-all">
                        {submissionHash}
                      </code>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
