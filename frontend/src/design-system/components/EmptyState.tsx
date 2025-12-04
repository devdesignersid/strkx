import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { scaleIn } from '../animations';
import { Button } from '@/design-system/components';

interface EmptyStateProps {
  /** Lucide icon - used when no illustration provided */
  icon?: LucideIcon;
  /** Custom illustration component - takes precedence over icon */
  illustration?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  illustration,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      animate="animate"
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-8",
        className
      )}
    >
      {/* Illustration or Icon */}
      {illustration ? (
        <div className="w-32 h-32 mb-6">
          {illustration}
        </div>
      ) : Icon ? (
        <div className="p-4 bg-secondary/50 rounded-full mb-6">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
      ) : null}

      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[300px] mb-6">{description}</p>

      {action && (
        <Button onClick={action.onClick}>
          {action.icon && <action.icon className="w-4 h-4" />}
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
