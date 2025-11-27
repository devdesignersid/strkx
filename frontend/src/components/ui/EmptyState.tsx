import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { scaleIn } from './DesignSystem';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      animate="animate"
      className={cn("flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-border bg-card/50", className)}
    >
      <div className="p-4 bg-secondary/50 rounded-full mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">{description}</p>

      {action && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
