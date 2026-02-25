// Login command — OAuth Device Flow for GitHub
// `chrisflex login` — browser-based GitHub login, no PAT needed
// `chrisflex logout` — remove saved credentials

import * as log from '../lib/logger.js';
import { githubDeviceLogin } from '../interactive/oauth.js';
import { loadCredentials, saveCredentials, getCredential } from '../interactive/auth.js';

export async function loginCommand(): Promise<void> {
  // Check if already logged in
  const existing = await getCredential('github');
  if (existing) {
    // Verify the token still works
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${existing}`,
          'Accept': 'application/json',
          'User-Agent': 'chrisflex-cli',
        },
      });
      if (res.ok) {
        const user = await res.json() as { login: string };
        log.success(`Already logged in as ${user.login}`);
        log.info('Run `chrisflex logout` first to switch accounts.');
        return;
      }
    } catch {
      // Token is invalid, continue with login
    }
  }

  console.log('');

  try {
    const result = await githubDeviceLogin(
      (userCode, verificationUri) => {
        console.log('');
        log.heading('GitHub Login');
        console.log('');
        console.log(`  First, copy your one-time code:  \x1b[1m\x1b[36m${userCode}\x1b[0m`);
        console.log('');
        console.log(`  Then open: \x1b[4m${verificationUri}\x1b[0m`);
        console.log('');
        log.info('Waiting for you to approve in your browser...');
      },
    );

    console.log('');
    const name = result.displayName ? ` (${result.displayName})` : '';
    log.success(`Logged in as ${result.username}${name}`);
    log.success('GitHub Models ready — GPT-4.1, GPT-4o available for free');
    console.log('');
    log.info('Run `chrisflex` to start chatting!');
  } catch (err) {
    console.log('');
    log.error(err instanceof Error ? err.message : String(err));
    console.log('');
    log.info('Alternatively, use `chrisflex auth github` to set a PAT manually.');
    process.exit(1);
  }
}

export async function logoutCommand(): Promise<void> {
  const creds = await loadCredentials();
  if (!creds.github) {
    log.info('Not logged in.');
    return;
  }

  delete creds.github;
  await saveCredentials(creds);
  log.success('Logged out. GitHub token removed.');
}
