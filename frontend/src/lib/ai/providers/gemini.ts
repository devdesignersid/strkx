import type { AIProvider, AIConfig } from '../types';
import { GoogleGenAI } from "@google/genai";

export class GeminiProvider implements AIProvider {
  id = 'gemini';
  name = 'Google Gemini';
  private config: AIConfig = { apiKey: '' };
  private client: GoogleGenAI | null = null;

  configure(config: AIConfig) {
    this.config = config;
    if (config.apiKey) {
        this.client = new GoogleGenAI({ apiKey: config.apiKey });
    }
  }

  async generateCompletion(prompt: string, systemPrompt?: string, images?: string[]): Promise<string> {
    if (!this.config.apiKey || !this.client) {
      throw new Error('API key not configured for Gemini');
    }

    const model = this.config.model || 'gemini-2.0-flash';

    const parts: any[] = [
        { text: systemPrompt ? `System Instruction: ${systemPrompt}\n\nUser Request: ${prompt}` : prompt }
    ];

    if (images && images.length > 0) {
        images.forEach(image => {
            // Ensure we strip the data URL prefix if present
            const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;
            parts.push({
                inlineData: {
                    mimeType: 'image/png',
                    data: base64Data
                }
            });
        });
    }

    try {
      const response = await this.client.models.generateContent({
        model: model,
        contents: [
            {
                role: 'user',
                parts: parts
            }
        ],
        config: {
            temperature: 0.7,
        }
      });

      return response.text || '';
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      throw new Error(error.message || 'Failed to fetch from Gemini');
    }
  }

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      const client = new GoogleGenAI({ apiKey });
      // Try a lightweight call to validate
      await client.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [{ role: 'user', parts: [{ text: 'Hi' }] }]
      });
      return true;
    } catch (error) {
      console.error('Key validation failed:', error);
      return false;
    }
  }
}
