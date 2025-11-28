import type { AIProvider, AIConfig, AIProviderMetadata } from './types';
import { GeminiProvider } from './providers/gemini';

class AIService {
  private activeProvider: AIProvider | null = null;
  private providers: Map<string, AIProvider> = new Map();
  private _isEnabled: boolean = false;

  constructor() {
    // Register default providers
    this.registerProvider(new GeminiProvider());
  }

  registerProvider(provider: AIProvider) {
    this.providers.set(provider.id, provider);
  }

  getAvailableProviders(): AIProviderMetadata[] {
    return [
      {
        id: 'gemini',
        name: 'Google Gemini',
        defaultModel: 'gemini-2.0-flash',
        models: ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3-pro-preview'],
      },
      // Add others here
    ];
  }

  configure(providerId: string, config: AIConfig) {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }
    provider.configure(config);
    this.activeProvider = provider;

    // Persist to localStorage for persistence across reloads
    localStorage.setItem('ai_provider', providerId);
    localStorage.setItem('ai_config', JSON.stringify(config));
  }

  setEnabled(enabled: boolean) {
      this._isEnabled = enabled;
      localStorage.setItem('ai_enabled', String(enabled));
  }

  isEnabled(): boolean {
      return this._isEnabled;
  }

  loadFromStorage() {
    const providerId = localStorage.getItem('ai_provider');
    const configStr = localStorage.getItem('ai_config');
    const enabledStr = localStorage.getItem('ai_enabled');

    if (enabledStr !== null) {
        this._isEnabled = enabledStr === 'true';
    }

    if (providerId && configStr) {
      try {
        const config = JSON.parse(configStr);
        this.configure(providerId, config);
      } catch (e) {
        console.error('Failed to load AI config', e);
      }
    }
  }

  async generateCompletion(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.activeProvider) {
      throw new Error('AI Service not configured');
    }
    return this.activeProvider.generateCompletion(prompt, systemPrompt);
  }

  async validateConnection(providerId: string, apiKey: string): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) return false;
    return provider.validateKey(apiKey);
  }

  isConfigured(): boolean {
      return this.activeProvider !== null;
  }
}

export const aiService = new AIService();
