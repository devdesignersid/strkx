import { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, Bot, Check, X, Loader2, Activity, User, LogOut } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useStudyTimer } from '../../context/StudyTimerContext';
import { useAuth } from '../../context/AuthContext';
import { aiService } from '../../lib/ai/aiService';
import type { AIProviderMetadata } from '../../lib/ai/types';
import { toast, TOAST_MESSAGES } from '@/lib/toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Modal, Label, Select } from '@/design-system/components';
import { userService } from '@/services/api/user.service';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { isEnabled: isTimerEnabled, toggleEnabled, triggerTestReminder } = useStudyTimer();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  // AI Settings State
  const [providers] = useState<AIProviderMetadata[]>(aiService.getAvailableProviders());
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // Load saved settings
  useEffect(() => {
    aiService.loadFromStorage();
    setIsEnabled(aiService.isEnabled());

    const savedProvider = aiService.getStoredProvider();
    if (savedProvider) setSelectedProvider(savedProvider);

    const config = aiService.getStoredConfig();
    if (config) {
      if (config.apiKey) setApiKey(config.apiKey);
      if (config.model) setModel(config.model);
    }
  }, []);

  const handleToggleEnabled = (enabled: boolean) => {
    setIsEnabled(enabled);
    aiService.setEnabled(enabled);
  };

  const handleTestConnection = async () => {
    if (!apiKey) {
      toast.error(TOAST_MESSAGES.AUTH.API_KEY_REQUIRED);
      return;
    }
    setIsTestingKey(true);
    setKeyStatus('idle');
    try {
      const isValid = await aiService.validateConnection(selectedProvider, apiKey);
      if (isValid) {
        setKeyStatus('valid');
        toast.success(TOAST_MESSAGES.AUTH.CONNECTION_SUCCESS);
        // Save immediately on success
        aiService.configure(selectedProvider, { apiKey, model });
      } else {
        setKeyStatus('invalid');
        toast.error(TOAST_MESSAGES.AUTH.CONNECTION_FAILED);
      }
    } catch (error) {
      setKeyStatus('invalid');
      toast.error(TOAST_MESSAGES.AUTH.CONNECTION_ERROR);
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      await userService.resetAccount();

      // Clear local storage but preserve auth/config
      const keysToPreserve = aiService.getStorageKeys();
      const preservedData: Record<string, string | null> = {};

      keysToPreserve.forEach(key => {
        preservedData[key] = localStorage.getItem(key);
      });

      localStorage.clear();

      // Restore preserved data
      Object.entries(preservedData).forEach(([key, value]) => {
        if (value) localStorage.setItem(key, value);
      });

      // Clear all React Query cache to ensure fresh data on reload
      queryClient.clear();

      toast.success(TOAST_MESSAGES.SETTINGS.RESET_SUCCESS);
      setShowConfirmDialog(false);

      // Reload the page to reflect changes
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      console.error('Error resetting data:', error);
      toast.error(TOAST_MESSAGES.SETTINGS.RESET_FAILED);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and application preferences
          </p>
        </div>

        {/* Account Settings */}
        <div className="mb-8 border border-border rounded-lg p-6 bg-card">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Account</h2>
                <p className="text-sm text-muted-foreground">
                  Manage your profile and session.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-white/5">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="w-12 h-12 rounded-full border border-border"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl border border-white/10">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{user?.name || 'User'}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={logout}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* AI Configuration */}
        <div className="mb-8 border border-border rounded-lg p-6 bg-card">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">AI Configuration</h2>
                <p className="text-sm text-muted-foreground">
                  Enable AI features to get hints, code completion, and solution analysis.
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={() => handleToggleEnabled(!isEnabled)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-card",
                isEnabled ? 'bg-primary' : 'bg-secondary'
              )}
            >
              <span className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                isEnabled ? 'translate-x-6' : 'translate-x-1'
              )} />
            </button>
          </div>

          <AnimatePresence>
            {isEnabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-4 max-w-xl pt-2 px-1">
                  <div>
                    <Label className="mb-1.5 block">Provider</Label>
                    <div className="relative">
                      <Select
                        value={selectedProvider}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedProvider(e.target.value)}
                      >
                        {providers.map(p => (
                          <option key={p.id} value={p.id} className="bg-popover text-popover-foreground">{p.name}</option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-1.5 block">API Key</Label>
                    <div className="relative">
                      <Input
                        type="password"
                        value={apiKey}
                        onChange={(e) => {
                          setApiKey(e.target.value);
                          setKeyStatus('idle');
                        }}
                        placeholder="sk-..."
                        className="pr-10 pl-3"
                      />
                      {keyStatus === 'valid' && (
                        <Check className="absolute right-3 top-2.5 w-4 h-4 text-green-500" />
                      )}
                      {keyStatus === 'invalid' && (
                        <X className="absolute right-3 top-2.5 w-4 h-4 text-destructive" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your key is stored securely in your browser's local storage.
                    </p>
                  </div>

                  <div>
                    <Label className="mb-1.5 block">Model (Optional)</Label>
                    <Input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="gemini-1.5-flash"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={handleTestConnection}
                      disabled={isTestingKey || !apiKey}
                      className="gap-2"
                    >
                      {isTestingKey ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        'Save & Test Connection'
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Focus Utility Configuration */}
        <div className="mb-8 border border-border rounded-lg p-6 bg-card">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Focus Utility</h2>
                <p className="text-sm text-muted-foreground">
                  Manage study timer, auto-pause, and health reminders.
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={() => toggleEnabled(!isTimerEnabled)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-card",
                isTimerEnabled ? 'bg-primary' : 'bg-secondary'
              )}
            >
              <span className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                isTimerEnabled ? 'translate-x-6' : 'translate-x-1'
              )} />
            </button>
          </div>

          <AnimatePresence>
            {isTimerEnabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-4 max-w-xl pt-2">
                  <div className="p-4 rounded-md bg-secondary/30 border border-white/5">
                    <h3 className="text-sm font-medium text-foreground mb-2">Reminders</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      We'll remind you to follow the 20-20-20 rule, stay hydrated, and stretch.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => triggerTestReminder('20-20-20')}
                    >
                      Test Reminder
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
                  <Button
                    variant="destructive"
                    onClick={() => setShowConfirmDialog(true)}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Reset Data
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Dialog */}
        <Modal
          isOpen={showConfirmDialog}
          onClose={() => !isResetting && setShowConfirmDialog(false)}
          title="Reset All Data?"
          description="This will permanently delete all your data. This action cannot be undone."
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => setShowConfirmDialog(false)}
                disabled={isResetting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleResetData}
                disabled={isResetting}
                className="gap-2"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Reset All Data
                  </>
                )}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm text-destructive-foreground">
                <p className="font-semibold mb-1">You are about to delete:</p>
                <ul className="list-disc list-inside space-y-1 opacity-90">
                  <li>All problem questions</li>
                  <li>All your code submissions</li>
                  <li>All saved solutions</li>
                  <li>All custom problem lists</li>
                  <li>All progress tracking data</li>
                </ul>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
