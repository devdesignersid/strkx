import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Droplets, Activity, ArrowRight } from 'lucide-react';
import { Button } from '@/design-system/components';

interface ReminderModalProps {
  isOpen: boolean;
  type: string; // '20-20-20', 'hydration', 'stretch'
  message: string;
  onDismiss: () => void;
}

const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, type, message, onDismiss }) => {
  const getIcon = () => {
    switch (type) {
      case '20-20-20': return <Eye className="w-6 h-6" />;
      case 'hydration': return <Droplets className="w-6 h-6" />;
      case 'stretch': return <Activity className="w-6 h-6" />;
      default: return <Activity className="w-6 h-6" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case '20-20-20': return 'Eye Rest';
      case 'hydration': return 'Hydration';
      case 'stretch': return 'Stretch Break';
      default: return 'Focus Reminder';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onDismiss}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0 }}
            className="relative w-full max-w-sm bg-[#1C1C1C] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 opacity-50" />

            <div className="p-6 flex flex-col items-center text-center">
              <div className="mb-4 p-3 rounded-full bg-primary/10 text-primary border border-primary/20">
                {getIcon()}
              </div>

              <h2 className="text-lg font-semibold text-foreground mb-2">
                {getTitle()}
              </h2>

              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                {message}
              </p>

              <Button
                onClick={onDismiss}
                className="w-full group"
              >
                <span>I'm back</span>
                <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(ReminderModal);
