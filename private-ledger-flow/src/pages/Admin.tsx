import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { Shield, Database, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/EmptyState';
import { useBackendRecords } from '@/hooks/useBackendRecords';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function Admin() {
  const { t } = useTranslation();
  const { address } = useAccount();
  const { data: backendRecords = [], isLoading } = useBackendRecords();

  // In production, check if address is contract deployer
  const isAdmin = true; // Mock for demo

  const handleComputeAggregate = async () => {
    toast.info('Computing homomorphic aggregate...');
    
    try {
      // Call backend coprocessor endpoint
      const response = await fetch(`${BACKEND_URL}/api/coproc/aggregate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cids: backendRecords.map(r => r.cid)
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Aggregate computed: ${result.encryptedTotal || '••••'} (encrypted)`);
      } else {
        throw new Error(result.error || 'Aggregation failed');
      }
    } catch (error: any) {
      console.error('Aggregation error:', error);
      toast.error('Failed to compute aggregate');
    }
  };

  if (!address) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <EmptyState
          icon={Shield}
          title="Access Restricted"
          description="Connect your wallet to access admin functions"
        />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <EmptyState
          icon={Shield}
          title="Unauthorized"
          description="Only the contract deployer can access this page"
        />
      </div>
    );
  }

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
            {t('nav.admin')}
          </h1>
          <p className="text-muted-foreground">
            Administrative functions and system overview
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Total Attestations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{backendRecords.length}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Encrypted Sum
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">••••</div>
              <p className="text-xs text-muted-foreground mt-1">
                Computed via FHE
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Unique Submitters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {new Set(backendRecords.map(r => r.userAddress)).size}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card className="border-border/50 bg-card/80 backdrop-blur mb-8">
          <CardHeader>
            <CardTitle>Homomorphic Computation</CardTitle>
            <CardDescription>
              Compute aggregate statistics over encrypted data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleComputeAggregate}
              className="bg-gradient-primary"
              disabled={backendRecords.length === 0 || isLoading}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Compute Encrypted Total
            </Button>
            
            <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h4 className="font-semibold mb-2">Coprocessor Integration</h4>
              <p className="text-sm text-muted-foreground mb-4">
                To enable real homomorphic computation, deploy a coprocessor endpoint that:
              </p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Accepts an array of encrypted values (ciphertexts)</li>
                <li>Performs homomorphic addition using Zama FHE SDK</li>
                <li>Returns the encrypted sum without decryption</li>
              </ol>
              <p className="text-sm text-muted-foreground mt-4">
                Backend endpoint: <code className="bg-muted px-1 rounded">/api/coproc/aggregate</code>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* All CIDs */}
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle>All Attestations</CardTitle>
            <CardDescription>
              Complete list of attested CIDs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading attestations...
                </div>
              ) : backendRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No attestations found
                </div>
              ) : (
                backendRecords.map((record, i) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <code className="text-sm font-mono truncate block">
                        {record.cid}
                      </code>
                      <p className="text-xs text-muted-foreground mt-1">
                        {record.blockNumber ? `Block ${record.blockNumber} • ` : ''}
                        {new Date(record.timestamp).toLocaleString()} • {record.userAddress.slice(0, 10)}...
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      #{i + 1}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
