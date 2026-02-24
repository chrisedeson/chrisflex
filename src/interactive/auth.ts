// Auth system — manages API keys and tokens for all providers
// Stored in ~/.chrisflex/credentials.json (user home, NOT project dir)
// Permissions: 600 (owner read/write only)

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CHRISFLEX_HOME = join(homedir(), '.chrisflex');
const CREDENTIALS_FILE = join(CHRISFLEX_HOME, 'credentials.json');

export interface Credentials {
  github?: string;      // GitHub PAT (models:read scope)
  anthropic?: string;   // Anthropic API key
  openai?: string;      // OpenAI API key
  gemini?: string;      // Google Gemini API key
}

async function ensureHomeDir(): Promise<void> {
  if (!existsSync(CHRISFLEX_HOME)) {
    await mkdir(CHRISFLEX_HOME, { recursive: true });
  }
}

export async function loadCredentials(): Promise<Credentials> {
  try {
    await ensureHomeDir();
    if (!existsSync(CREDENTIALS_FILE)) return {};
    const raw = await readFile(CREDENTIALS_FILE, 'utf-8');
    return JSON.parse(raw) as Credentials;
  } catch {
    return {};
  }
}

export async function saveCredentials(creds: Credentials): Promise<void> {
  await ensureHomeDir();
  await writeFile(CREDENTIALS_FILE, JSON.stringify(creds, null, 2), { mode: 0o600 });
}

export async function setCredential(provider: keyof Credentials, token: string): Promise<void> {
  const creds = await loadCredentials();
  creds[provider] = token;
  await saveCredentials(creds);
}

export async function getCredential(provider: keyof Credentials): Promise<string | undefined> {
  // Environment variables take priority
  const envMap: Record<string, string> = {
    github: 'GITHUB_TOKEN',
    anthropic: 'ANTHROPIC_API_KEY',
    openai: 'OPENAI_API_KEY',
    gemini: 'GEMINI_API_KEY',
  };

  const envKey = envMap[provider];
  if (envKey && process.env[envKey]) {
    return process.env[envKey];
  }

  const creds = await loadCredentials();
  return creds[provider];
}

export async function getAvailableProviders(): Promise<string[]> {
  const providers: string[] = [];
  if (await getCredential('github')) providers.push('github');
  if (await getCredential('anthropic')) providers.push('anthropic');
  if (await getCredential('openai')) providers.push('openai');
  if (await getCredential('gemini')) providers.push('gemini');
  return providers;
}
