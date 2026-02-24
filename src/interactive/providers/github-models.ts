// GitHub Models provider — free models via GitHub PAT
// Uses OpenAI-compatible API at https://models.github.ai/inference
// Free for GitHub Education students (GPT-4.1, GPT-4o = 0x multiplier = unlimited)
import OpenAI from 'openai';
import { getCredential } from '../auth.js';
import type { AIProvider, ProviderInfo, StreamEvent, StreamOptions } from './types.js';

export class GitHubModelsProvider implements AIProvider {
  readonly info: ProviderInfo = {
    id: 'github',
    name: 'GitHub Models',
    models: [
      { id: 'openai/gpt-4.1', name: 'GPT-4.1', provider: 'github', contextWindow: 128000, costTier: 'free', premiumMultiplier: 0 },
      { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'github', contextWindow: 128000, costTier: 'free', premiumMultiplier: 0 },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'github', contextWindow: 128000, costTier: 'free', premiumMultiplier: 0 },
    ],
    requiresAuth: true,
    authType: 'pat',
  };

  private client: OpenAI | null = null;

  async isReady(): Promise<boolean> {
    const token = await getCredential('github');
    return !!token;
  }

  private async getClient(): Promise<OpenAI> {
    if (!this.client) {
      const token = await getCredential('github');
      if (!token) throw new Error('GitHub token not set. Run: chrisflex auth github');
      this.client = new OpenAI({
        apiKey: token,
        baseURL: 'https://models.github.ai/inference',
      });
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
