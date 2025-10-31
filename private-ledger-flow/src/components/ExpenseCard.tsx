import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ExternalLink, Lock, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { Expense } from '@/types/expense';
import { getSepoliaExplorerUrl, getSepoliaAddressUrl } from '@/lib/contract';
import { getIPFSUrl } from '@/lib/ipfs';
import { cn } from '@/lib/utils';

interface ExpenseCardProps {
  expense: Expense;
  onDecrypt?: () => void;
  showDecrypt?: boolean;
}

const categoryIcons: Record<string, string> = {
  food: '🍽️',
  travel: '✈️',
  salary: '💰',
  shopping: '🛍️',
  utilities: '⚡',
  misc: '📦',
};

const categoryColors: Record<string, string> = {
  food: 'bg-orange-500/10 text-orange-500',
  travel: 'bg-blue-500/10 text-blue-500',
  salary: 'bg-green-500/10 text-green-500',
  shopping: 'bg-purple-500/10 text-purple-500',
  utilities: 'bg-yellow-500/10 text-yellow-500',
  misc: 'bg-gray-500/10 text-gray-500',
};

export function ExpenseCard({ expense, onDecrypt, showDecrypt = false }: ExpenseCardProps) {
  const { t } = useTranslation();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryLabel = (category: string) => {
    return t(`expense.categories.${category}` as any);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur transition-smooth hover:border-primary/50 hover:shadow-glow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              {/* Category Icon */}
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl text-xl',
                categoryColors[expense.category]
              )}>
                {categoryIcons[expense.category]}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm">
                    {getCategoryLabel(expense.category)}
                  </h3>
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                  >
                    {expense.currency}
                  </Badge>
                </div>
                
                {expense.encrypted ? (
                  <p className="text-2xl font-bold text-primary mb-1 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    ••••
                  </p>
                ) : (
                  <p className="text-2xl font-bold mb-1">
                    {expense.amount.toLocaleString()}
                  </p>
                )}

                {expense.note && (
                  <p className="text-xs text-muted-foreground mb-2 truncate">
                    {expense.note}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDate(expense.timestamp)}
                </div>
              </div>
            </div>

            {/* Status & Actions */}
            <div className="flex flex-col items-end gap-2">
              {expense.status === 'attested' && (
                <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {t('dashboard.attested')}
                </Badge>
              )}
              {expense.status === 'pending' && (
                <Badge variant="secondary">
                  <Clock className="mr-1 h-3 w-3" />
                  Pending
                </Badge>
              )}

              <div className="flex gap-1">
                {expense.txHash && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => window.open(getSepoliaExplorerUrl(expense.txHash!), '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                {showDecrypt && onDecrypt && expense.encrypted && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDecrypt}
                    className="text-xs"
                  >
                    {t('records.decrypt')}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* CID Link */}
          {expense.cid && (
            <div className="mt-3 pt-3 border-t border-border/30">
              <a
                href={getIPFSUrl(expense.cid)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <span className="font-mono truncate">CID: {expense.cid.slice(0, 20)}...</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
