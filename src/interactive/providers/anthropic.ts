// Anthropic provider — Claude models via direct API
import Anthropic from '@anthropic-ai/sdk';
import { getCredential } from '../auth.js';
import type { AIProvider, ProviderInfo, StreamEvent, StreamOptions } from './types.js';

export class AnthropicProvider implements AIProvider {
  readonly info: ProviderInfo = {
    id: 'anthropic',
    name: 'Anthropic',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic', contextWindow: 200000, costTier: 'standard' },
      { id: 'claude-haiku-4-20250414', name: 'Claude Haiku 4', provider: 'anthropic', contextWindow: 200000, costTier: 'cheap' },
    ],
    requiresAuth: true,
    authType: 'api-key',
  };

  private client: Anthropic | null = null;

  async isReady(): Promise<boolean> {
    const key = await getCredential('anthropic');
    return !!key;
  }

  private async getClient(): Promise<Anthropic> {
    if (!this.client) {
      const key = await getCredential('anthropic');
      if (!key) throw new Error('Anthropic API key not set. Run: chrisflex auth anthropic');
      this.client = new Anthropic({ apiKey: key });
    }
    return this.client;
  }

  async *stream(opts: StreamOptions): AsyncGenerator<StreamEvent> {
    const client = await this.getClient();

    const messages = opts.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const stream = client.messages.stream({
      model: opts.model,
      max_tokens: opts.maxTokens ?? 4096,
      temperature: opts.temperature ?? 0.7,
      system: opts.systemPrompt,
      messages,
    });

    try {
      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          const delta = event.delta as { type: string; text?: string };
          if (delta.type === 'text_delta' && delta.text) {
            yield { type: 'text', content: delta.text };
          }
        }
      }
      yield { type: 'done', content: '' };
    } catch (err) {
      yield { type: 'error', content: err instanceof Error ? err.message : String(err) };
    }
  }
}
