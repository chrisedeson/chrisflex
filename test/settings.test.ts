import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { initializeFlexDir } from '../src/lib/memory.js';
import type { ChrisflexConfig } from '../src/types.js';

let tmpDir: string;
let flexDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'chrisflex-settings-'));
  flexDir = await initializeFlexDir(tmpDir, 'test-project');
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

/** Read config.json as parsed object */
async function readConfig(): Promise<ChrisflexConfig> {
  return JSON.parse(await readFile(join(flexDir, 'config.json'), 'utf8'));
}

/**
 * Helper: simulate settingsCommand set logic
 * (settingsCommand uses getFlexDir() which relies on process.cwd())
 */
async function setSetting(setExpr: string): Promise<{ success: boolean; error?: string }> {
  const configPath = join(flexDir, 'config.json');
  const config: ChrisflexConfig = JSON.parse(await readFile(configPath, 'utf8'));

  const eqIdx = setExpr.indexOf('=');
  if (eqIdx === -1) {
    return { success: false, error: 'Invalid format' };
  }

  const key = setExpr.slice(0, eqIdx).trim();
  const rawValue = setExpr.slice(eqIdx + 1).trim();
  const parts = key.split('.');

  if (parts.length !== 2) {
    return { success: false, error: 'Need exactly 2 levels' };
  }

  const [section, prop] = parts as [string, string];

  if (!(section in config)) {
    return { success: false, error: `Unknown section: ${section}` };
  }

  const sectionObj = config[section as keyof ChrisflexConfig];
  if (typeof sectionObj !== 'object' || sectionObj === null) {
    return { success: false, error: `Not configurable: ${section}` };
  }

  if (!(prop in sectionObj)) {
    return { success: false, error: `Unknown key: ${prop}` };
  }

  const currentValue = (sectionObj as Record<string, unknown>)[prop];
  let newValue: unknown;

  if (typeof currentValue === 'boolean') {
    newValue = rawValue === 'true';
  } else if (typeof currentValue === 'number') {
    newValue = Number(rawValue);
    if (isNaN(newValue as number)) {
      return { success: false, error: 'Not a valid number' };
    }
  } else {
    newValue = rawValue;
  }

  (sectionObj as Record<string, unknown>)[prop] = newValue;
  await writeFile(configPath, JSON.stringify(config, null, 2) + '\n');

  return { success: true };
}

describe('settings', () => {
  it('initial config has correct defaults', async () => {
    const config = await readConfig();

    expect(config.version).toBe('0.1.0');
    expect(config.project.name).toBe('test-project');
    expect(config.git.noCoAuthor).toBe(true);
    expect(config.git.commitModel).toBe('free');
    expect(config.git.autoBranch).toBe(false);
    expect(config.screenshots.autoApprove).toBe(false);
    expect(config.screenshots.viewport).toBe('1280x720');
    expect(config.screenshots.format).toBe('jpeg');
    expect(config.screenshots.quality).toBe(80);
    expect(config.scaling.defaultMode).toBe('auto');
  });

  it('sets boolean value with type coercion', async () => {
    const result = await setSetting('git.autoBranch=true');
    expect(result.success).toBe(true);

    const config = await readConfig();
    expect(config.git.autoBranch).toBe(true);
  });

  it('sets boolean false correctly', async () => {
    // First set to true, then back to false
    await setSetting('git.autoBranch=true');
    const result = await setSetting('git.autoBranch=false');
    expect(result.success).toBe(true);

    const config = await readConfig();
    expect(config.git.autoBranch).toBe(false);
  });

  it('sets number value with type coercion', async () => {
    const result = await setSetting('screenshots.quality=95');
    expect(result.success).toBe(true);

    const config = await readConfig();
    expect(config.screenshots.quality).toBe(95);
  });

  it('sets string value', async () => {
    const result = await setSetting('screenshots.viewport=1920x1080');
    expect(result.success).toBe(true);

    const config = await readConfig();
    expect(config.screenshots.viewport).toBe('1920x1080');
  });

  it('sets project description', async () => {
    const result = await setSetting('project.description=My awesome project');
    expect(result.success).toBe(true);

    const config = await readConfig();
    expect(config.project.description).toBe('My awesome project');
  });

  it('rejects invalid section', async () => {
    const result = await setSetting('badSection.key=value');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown section');
  });

  it('rejects invalid key in valid section', async () => {
    const result = await setSetting('git.badKey=value');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown key');
  });

  it('rejects missing equals sign', async () => {
    const result = await setSetting('git.autoBranch');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid format');
  });

  it('rejects more than 2 levels of nesting', async () => {
    const result = await setSetting('git.auto.branch=true');
    expect(result.success).toBe(false);
    expect(result.error).toContain('exactly 2 levels');
  });

  it('rejects invalid number', async () => {
    const result = await setSetting('screenshots.quality=abc');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Not a valid number');
  });

  it('preserves other settings when changing one', async () => {
    await setSetting('git.autoBranch=true');
    await setSetting('screenshots.quality=95');

    const config = await readConfig();
    // Changed values
    expect(config.git.autoBranch).toBe(true);
    expect(config.screenshots.quality).toBe(95);
    // Preserved values
    expect(config.git.noCoAuthor).toBe(true);
    expect(config.git.commitModel).toBe('free');
    expect(config.screenshots.viewport).toBe('1280x720');
    expect(config.project.name).toBe('test-project');
  });
});
