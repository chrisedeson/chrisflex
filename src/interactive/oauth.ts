// OAuth Device Flow for GitHub authentication
// Users run `chrisflex login` → get a code → open browser → approve → done
// No server needed, no callback, works in any terminal

import { setCredential } from './auth.js';

const GITHUB_CLIENT_ID = 'Ov23liNHFAnmgMHqYbsB';
const DEVICE_CODE_URL = 'https://github.com/login/device/code';
const TOKEN_URL = 'https://github.com/login/oauth/access_token';
const USER_URL = 'https://api.github.com/user';

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

interface TokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUser {
  login: string;
  name: string | null;
}

/** Step 1: Request a device code from GitHub */
async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const res = await fetch(DEVICE_CODE_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
    }),
  });

  if (!res.ok) {
    throw new Error(`GitHub device code request failed: ${res.status} ${res.statusText}`);
  }

  return await res.json() as DeviceCodeResponse;
}

/** Step 2: Poll for the access token (user is approving in browser) */
async function pollForToken(deviceCode: string, interval: number, expiresIn: number): Promise<string> {
  const deadline = Date.now() + expiresIn * 1000;
  const pollInterval = Math.max(interval, 5) * 1000; // GitHub requires minimum 5s

  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));

    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    });

    const data = await res.json() as TokenResponse;

    if (data.access_token) {
      return data.access_token;
    }

    if (data.error === 'authorization_pending') {
      // User hasn't approved yet, keep polling
      continue;
    }

    if (data.error === 'slow_down') {
      // Back off — add 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));
      continue;
    }

    if (data.error === 'expired_token') {
      throw new Error('Login timed out. Please try again.');
    }

    if (data.error === 'access_denied') {
      throw new Error('Login was denied. Please try again.');
    }

    throw new Error(data.error_description ?? data.error ?? 'Unknown error during login');
  }

  throw new Error('Login timed out. Please try again.');
}

/** Step 3: Get the authenticated user's info */
async function getGitHubUser(token: string): Promise<GitHubUser> {
  const res = await fetch(USER_URL, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'User-Agent': 'chrisflex-cli',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to get user info: ${res.status}`);
  }

  return await res.json() as GitHubUser;
}

/** Try to open a URL in the user's default browser */
async function openBrowser(url: string): Promise<boolean> {
  try {
    const { exec } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execAsync = promisify(exec);

    const platform = process.platform;
    if (platform === 'darwin') {
      await execAsync(`open "${url}"`);
    } else if (platform === 'win32') {
      await execAsync(`start "" "${url}"`);
    } else {
      // Linux — try xdg-open, then sensible-browser, then wslview
      try {
        await execAsync(`xdg-open "${url}"`);
      } catch {
        try {
          await execAsync(`sensible-browser "${url}"`);
        } catch {
          try {
            await execAsync(`wslview "${url}"`);
          } catch {
            return false;
          }
        }
      }
    }
    return true;
  } catch {
    return false;
  }
}

export interface LoginResult {
  token: string;
  username: string;
  displayName: string | null;
}

/**
 * Full OAuth Device Flow login
 * Returns the token and username on success
 *
 * @param onCode - Callback when the user code is ready (for display)
 * @param onWaiting - Callback while polling (for spinner updates)
 */
export async function githubDeviceLogin(
  onCode: (userCode: string, verificationUri: string) => void,
  onWaiting?: () => void,
): Promise<LoginResult> {
  // Step 1: Get device code
  const deviceCode = await requestDeviceCode();

  // Show the code to the user
  onCode(deviceCode.user_code, deviceCode.verification_uri);

  // Try to open browser automatically
  await openBrowser(deviceCode.verification_uri);

  // Step 2: Poll for token
  const token = await pollForToken(
    deviceCode.device_code,
    deviceCode.interval,
    deviceCode.expires_in,
  );

  // Step 3: Get user info
  const user = await getGitHubUser(token);

  // Step 4: Save the token
  await setCredential('github', token);

  return {
    token,
    username: user.login,
    displayName: user.name,
  };
}
