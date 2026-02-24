// Provider abstraction layer — unified interface for all AI providers
// Modeled after OpenCode's Provider interface

export interface StreamEvent {
  type: 'text' | 'thinking' | 'tool_start' | 'tool_delta' | 'tool_end' | 'done' | 'error';
  content: string;
  toolName?: string;
  toolId?: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  timestamp?: string;
}

export interface StreamOptions {
  model: string;
  messages: Message[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}

export interface ProviderInfo {
  id: string;
  name: string;
  models: ModelInfo[];
  requiresAuth: boolean;
  authType: 'api-key' | 'oauth' | 'pat';
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  costTier: 'free' | 'cheap' | 'standard' | 'expensive';
  /** Copilot premium request multiplier (0 = free/unlimited) */
  premiumMultiplier?: number;
}

export interface AIProvider {
  readonly info: ProviderInfo;
  /** Check if provider is authenticated and ready */
  isReady(): Promise<boolean>;
  /** Stream a response — yields events as they arrive */
  stream(opts: StreamOptions): AsyncGenerator<StreamEvent>;
}

// Model registry — all known models with cost tiers
export const MODELS: ModelInfo[] = [
  // GitHub Models (free with Education)
  { id: 'openai/gpt-4.1', name: 'GPT-4.1', provider: 'github', contextWindow: 128000, costTier: 'free', premiumMultiplier: 0 },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'github', contextWindow: 128000, costTier: 'free', premiumMultiplier: 0 },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'github', contextWindow: 128000, costTier: 'free', premiumMultiplier: 0 },

  // Anthropic (direct API)
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic', contextWindow: 200000, costTier: 'standard' },
  { id: 'claude-haiku-4-20250414', name: 'Claude Haiku 4', provider: 'anthropic', contextWindow: 200000, costTier: 'cheap' },

  // OpenAI (direct API)
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', contextWindow: 128000, costTier: 'standard' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', contextWindow: 128000, costTier: 'cheap' },
];

// Auto-routing: pick best model for task complexity
export function autoRoute(complexity: 'simple' | 'medium' | 'complex', availableProviders: string[]): ModelInfo | undefined {
  const models = MODELS.filter(m => availableProviders.includes(m.provider));

  if (complexity === 'simple') {
    // Free tier first
    return models.find(m => m.costTier === 'free') ?? models.find(m => m.costTier === 'cheap');
  }
  if (complexity === 'medium') {
    return models.find(m => m.costTier === 'standard') ?? models.find(m => m.costTier === 'cheap');
  }
  // complex
  return models.find(m => m.costTier === 'expensive') ?? models.find(m => m.costTier === 'standard');
}
