import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 shadow-glow">
        <Icon className="h-12 w-12 text-primary" />
      </div>
      
      <h3 className="mb-2 text-2xl font-bold">{title}</h3>
      <p className="mb-6 max-w-md text-muted-foreground">{description}</p>
      
      {action && (
        <Button
          onClick={action.onClick}
          size="lg"
          className="bg-gradient-primary shadow-glow"
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
