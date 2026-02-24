// OpenAI direct provider — for users with their own OpenAI API key
import OpenAI from 'openai';
import { getCredential } from '../auth.js';
import type { AIProvider, ProviderInfo, StreamEvent, StreamOptions } from './types.js';

export class OpenAIProvider implements AIProvider {
  readonly info: ProviderInfo = {
    id: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', contextWindow: 128000, costTier: 'standard' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', contextWindow: 128000, costTier: 'cheap' },
    ],
    requiresAuth: true,
    authType: 'api-key',
  };

  private client: OpenAI | null = null;

  async isReady(): Promise<boolean> {
    const key = await getCredential('openai');
    return !!key;
  }

  private async getClient(): Promise<OpenAI> {
    if (!this.client) {
      const key = await getCredential('openai');
      if (!key) throw new Error('OpenAI API key not set. Run: chrisflex auth openai');
      this.client = new OpenAI({ apiKey: key });
    }
    return this.client;
  }

  async *stream(opts: StreamOptions): AsyncGenerator<StreamEvent> {
    const client = await this.getClient();

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    if (opts.systemPrompt) {
      messages.push({ role: 'system', content: opts.systemPrompt });
    }

    for (const m of opts.messages) {
      messages.push({ role: m.role, content: m.content });
    }

    try {
      const stream = await client.chat.completions.create({
        model: opts.model,
        messages,
        max_tokens: opts.maxTokens ?? 4096,
        temperature: opts.temperature ?? 0.7,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield { type: 'text', content };
        }
      }
      yield { type: 'done', content: '' };
    } catch (err) {
      yield { type: 'error', content: err instanceof Error ? err.message : String(err) };
    }
  }
}
