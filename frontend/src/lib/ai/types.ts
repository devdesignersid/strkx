export interface AIConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export interface AIProvider {
  id: string;
  name: string;
  configure(config: AIConfig): void;
  generateCompletion(prompt: string, systemPrompt?: string, images?: string[]): Promise<string>;
  validateKey(apiKey: string): Promise<boolean>;
}

export interface AIProviderMetadata {
  id: string;
  name: string;
  defaultBaseUrl?: string;
  defaultModel?: string;
  models: string[];
}
