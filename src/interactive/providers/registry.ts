// Provider registry — factory + management for all AI providers
import { getAvailableProviders } from '../auth.js';
import { AnthropicProvider } from './anthropic.js';
import { GitHubModelsProvider } from './github-models.js';
import { OpenAIProvider } from './openai.js';
import type { AIProvider, ModelInfo } from './types.js';

const providerInstances: Map<string, AIProvider> = new Map();

function getProvider(id: string): AIProvider {
  let provider = providerInstances.get(id);
  if (!provider) {
    switch (id) {
      case 'github':
        provider = new GitHubModelsProvider();
        break;
      case 'anthropic':
        provider = new AnthropicProvider();
        break;
      case 'openai':
        provider = new OpenAIProvider();
        break;
      default:
        throw new Error(`Unknown provider: ${id}`);
    }
    providerInstances.set(id, provider);
  }
  return provider;
}

/** Get all providers that have valid credentials */
export async function getReadyProviders(): Promise<AIProvider[]> {
  const available = await getAvailableProviders();
  return available.map(id => getProvider(id));
}

/** Get all models from all ready providers */
export async function getAvailableModels(): Promise<ModelInfo[]> {
  const providers = await getReadyProviders();
  return providers.flatMap(p => p.info.models);
}

/** Get a specific provider by ID */
export function getProviderById(id: string): AIProvider {
  return getProvider(id);
}

/** Find which provider serves a given model ID */
export function getProviderForModel(modelId: string): AIProvider | undefined {
  // Check all known providers
  for (const id of ['github', 'anthropic', 'openai']) {
    const provider = getProvider(id);
    if (provider.info.models.some(m => m.id === modelId)) {
      return provider;
    }
  }
  return undefined;
}

/** Get the best default model from available providers */
export async function getDefaultModel(): Promise<{ model: ModelInfo; provider: AIProvider } | undefined> {
  const available = await getAvailableProviders();

  // Priority: github free models first, then anthropic, then openai
  if (available.includes('github')) {
    const provider = getProvider('github');
    const model = provider.info.models[0]; // GPT-4.1 (free)
    if (model) return { model, provider };
  }

  if (available.includes('anthropic')) {
    const provider = getProvider('anthropic');
    const model = provider.info.models[0]; // Claude Sonnet
    if (model) return { model, provider };
  }

  if (available.includes('openai')) {
    const provider = getProvider('openai');
    const model = provider.info.models[0]; // GPT-4o
    if (model) return { model, provider };
  }

  return undefined;
}
