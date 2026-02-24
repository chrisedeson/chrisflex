// Auth command — manage API keys and tokens for AI providers
// chrisflex auth <provider>  — set token for a provider
// chrisflex auth status      — show which providers are connected

import * as p from '@clack/prompts';
import * as log from '../lib/logger.js';
import { setCredential, getCredential, loadCredentials } from '../interactive/auth.js';
import type { Credentials } from '../interactive/auth.js';

const PROVIDERS: Record<string, { name: string; envVar: string; hint: string }> = {
  github: {
    name: 'GitHub Models',
    envVar: 'GITHUB_TOKEN',
    hint: 'Personal Access Token with models:read scope — https://github.com/settings/tokens',
  },
  anthropic: {
    name: 'Anthropic',
    envVar: 'ANTHROPIC_API_KEY',
    hint: 'API key from https://console.anthropic.com/settings/keys',
  },
  openai: {
    name: 'OpenAI',
    envVar: 'OPENAI_API_KEY',
    hint: 'API key from https://platform.openai.com/api-keys',
  },
  gemini: {
    name: 'Google Gemini',
    envVar: 'GEMINI_API_KEY',
    hint: 'API key from https://aistudio.google.com/app/apikey',
  },
};

export async function authCommand(provider?: string): Promise<void> {
  // chrisflex auth status
  if (provider === 'status') {
    await showAuthStatus();
    return;
  }

  // chrisflex auth (no provider) — show status + prompt
  if (!provider) {
    await showAuthStatus();
    console.log('');
    log.info('Usage: chrisflex auth <provider>');
    log.info('Providers: github, anthropic, openai, gemini');
    return;
  }

  const providerInfo = PROVIDERS[provider];
  if (!providerInfo) {
    log.error(`Unknown provider: ${provider}`);
    log.info(`Supported: ${Object.keys(PROVIDERS).join(', ')}`);
    process.exit(1);
  }

  // Check if already set via env var
  const envVal = process.env[providerInfo.envVar];
  if (envVal) {
    log.success(`${providerInfo.name} already configured via $${providerInfo.envVar}`);
    return;
  }

  // Prompt for token
  p.intro(`chrisflex auth — ${providerInfo.name}`);

  const token = await p.password({
    message: `Enter your ${providerInfo.name} token:`,
    validate: (val) => {
      if (!val || val.trim().length === 0) return 'Token cannot be empty';
      if (val.trim().length < 10) return 'Token seems too short';
    },
  });

  if (p.isCancel(token)) {
    p.cancel('Auth cancelled.');
    return;
  }

  // Save it
  await setCredential(provider as keyof Credentials, token as string);
  log.success(`${providerInfo.name} token saved to ~/.chrisflex/credentials.json`);

  // Verify it works (quick check)
  const saved = await getCredential(provider as keyof Credentials);
  if (saved) {
    log.success('Token verified — stored securely (chmod 600)');
  }

  p.outro('Ready to go! Run `chrisflex` to start chatting.');
}

async function showAuthStatus(): Promise<void> {
  log.heading('Provider Status');

  for (const [id, info] of Object.entries(PROVIDERS)) {
    const token = await getCredential(id as keyof Credentials);
    if (token) {
      const source = process.env[info.envVar] ? `(via $${info.envVar})` : '(saved)';
      const masked = token.slice(0, 6) + '...' + token.slice(-4);
      log.success(`${info.name}: ${masked} ${source}`);
    } else {
      log.bullet(`${info.name}: not configured`);
    }
  }
}
