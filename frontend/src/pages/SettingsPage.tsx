
import { useState } from 'react';
import { Trash2, AlertTriangle, Bot, Check, X, Loader2 } from 'lucide-react';
import { aiService } from '../lib/ai/aiService';
import type { AIProviderMetadata } from '../lib/ai/types';
import axios from 'axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsPage() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // AI Settings State
  const [providers] = useState<AIProviderMetadata[]>(aiService.getAvailableProviders());
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // Load saved settings
  useState(() => {
    aiService.loadFromStorage();
    setIsEnabled(aiService.isEnabled());

    const savedProvider = localStorage.getItem('ai_provider');
    if (savedProvider) setSelectedProvider(savedProvider);

    const savedConfigStr = localStorage.getItem('ai_config');
    if (savedConfigStr) {
        const config = JSON.parse(savedConfigStr);
        if (config.apiKey) setApiKey(config.apiKey);
        if (config.model) setModel(config.model);
    }
  });

  const handleToggleEnabled = (enabled: boolean) => {
      setIsEnabled(enabled);
      aiService.setEnabled(enabled);
  };

  const handleTestConnection = async () => {
    if (!apiKey) {
        toast.error('Please enter an API key');
        return;
    }
    setIsTestingKey(true);
    setKeyStatus('idle');
    try {
        const isValid = await aiService.validateConnection(selectedProvider, apiKey);
        if (isValid) {
            setKeyStatus('valid');
            toast.success('Connection successful!');
            // Save immediately on success
            aiService.configure(selectedProvider, { apiKey, model });
        } else {
            setKeyStatus('invalid');
            toast.error('Invalid API key or connection failed');
        }
    } catch (error) {
        setKeyStatus('invalid');
        toast.error('Connection failed');
    } finally {
        setIsTestingKey(false);
    }
  };

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
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-card ${isEnabled ? 'bg-primary' : 'bg-secondary'}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
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
                        <div className="space-y-4 max-w-xl pt-2">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Provider</label>
                                <div className="relative">
                                    <select
                                        value={selectedProvider}
                                        onChange={(e) => setSelectedProvider(e.target.value)}
                                        className="w-full px-3 py-2 rounded-md border border-white/5 bg-secondary/30 text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
                                    >
                                        {providers.map(p => (
                                            <option key={p.id} value={p.id} className="bg-card text-foreground">{p.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-2.5 pointer-events-none text-muted-foreground">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">API Key</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => {
                                            setApiKey(e.target.value);
                                            setKeyStatus('idle');
                                        }}
                                        placeholder="sk-..."
                                        className="w-full px-3 py-2 rounded-md border border-white/5 bg-secondary/30 text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors pr-10"
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
                                <label className="block text-sm font-medium text-foreground mb-1">Model (Optional)</label>
                                <input
                                    type="text"
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    placeholder="gemini-1.5-flash"
                                    className="w-full px-3 py-2 rounded-md border border-white/5 bg-secondary/30 text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={handleTestConnection}
                                    disabled={isTestingKey || !apiKey}
                                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-sm disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isTestingKey ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Testing...
                                        </>
                                    ) : (
                                        'Save & Test Connection'
                                    )}
                                </button>
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
