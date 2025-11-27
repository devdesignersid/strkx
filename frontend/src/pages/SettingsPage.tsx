import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsPage() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      await axios.delete('http://localhost:3000/user/reset');
      toast.success('All data reset successfully!', {
        description: 'Your progress has been cleared.',
      });
      setShowConfirmDialog(false);

      // Reload the page to reflect changes
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      console.error('Error resetting data:', error);
      toast.error('Failed to reset data', {
        description: 'Please try again later.',
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and application preferences
          </p>
        </div>

        {/* Danger Zone */}
        <div className="border border-destructive/30 rounded-lg p-6 bg-destructive/5">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground mb-1">Danger Zone</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Irreversible and destructive actions
              </p>

              <div className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-1">Reset All Data</h3>
                    <p className="text-sm text-muted-foreground">
                      Delete all problems, submissions, lists, and progress. This will completely reset the application.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowConfirmDialog(true)}
                    className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors font-medium text-sm whitespace-nowrap flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Reset Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Dialog */}
        <AnimatePresence>
          {showConfirmDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50"
                onClick={() => !isResetting && setShowConfirmDialog(false)}
              />

              {/* Dialog */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative z-10 w-full max-w-md mx-4"
              >
                <div className="bg-card border border-border rounded-lg shadow-xl p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <AlertTriangle className="w-6 h-6 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        Reset All Data?
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        This will permanently delete:
                      </p>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                        <li>All problem questions</li>
                        <li>All your code submissions</li>
                        <li>All saved solutions</li>
                        <li>All custom problem lists</li>
                        <li>All progress tracking data</li>
                      </ul>
                      <p className="text-sm font-medium text-destructive mt-3">
                        This action cannot be undone. You'll need to re-import problems.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end mt-6">
                    <button
                      onClick={() => setShowConfirmDialog(false)}
                      disabled={isResetting}
                      className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors font-medium text-sm disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleResetData}
                      disabled={isResetting}
                      className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors font-medium text-sm disabled:opacity-50 flex items-center gap-2"
                    >
                      {isResetting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Reset All Data
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
