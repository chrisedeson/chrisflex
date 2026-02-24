import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { initializeFlexDir, syncMemoryIndex } from '../src/lib/memory.js';

let tmpDir: string;
let flexDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'chrisflex-shortcut-'));
  flexDir = await initializeFlexDir(tmpDir, 'test-project');
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

/**
 * Helper: simulate what shortcutCommand does (add/update shortcut row + sync)
 */
async function addShortcut(
  name: string,
  value: string,
  description = ''
): Promise<void> {
  const scPath = join(flexDir, 'shortcuts.md');
  const content = await readFile(scPath, 'utf8');
  const lines = content.split('\n');
  const date = '2026-02-24';

  // Check for duplicate
  const existing = lines.find((l) => {
    const parts = l.split('|').map((p) => p.trim());
    return parts[1]?.toLowerCase() === name.toLowerCase();
  });

  if (existing) {
    const idx = lines.indexOf(existing);
    const desc = description || existing.split('|').map((p) => p.trim())[3] || '';
    lines[idx] = `| ${name} | ${value} | ${desc} | ${date} |`;
    await writeFile(scPath, lines.join('\n'));
  } else {
    const newRow = `| ${name} | ${value} | ${description} | ${date} |`;
    lines.push(newRow);
    await writeFile(scPath, lines.join('\n'));
  }

  await syncMemoryIndex(flexDir);
}

describe('shortcut', () => {
  it('appends a shortcut row to shortcuts.md', async () => {
    await addShortcut('deploy', 'npm run deploy', 'Deploy to prod');

    const content = await readFile(join(flexDir, 'shortcuts.md'), 'utf8');
    expect(content).toContain('deploy');
    expect(content).toContain('npm run deploy');
    expect(content).toContain('Deploy to prod');
  });

  it('adds multiple shortcuts', async () => {
    await addShortcut('deploy', 'npm run deploy', 'Deploy');
    await addShortcut('test', 'npm test', 'Run tests');

    const content = await readFile(join(flexDir, 'shortcuts.md'), 'utf8');
    expect(content).toContain('deploy');
    expect(content).toContain('test');
    expect(content).toContain('npm run deploy');
    expect(content).toContain('npm test');
  });

  it('updates existing shortcut with same name', async () => {
    await addShortcut('deploy', 'npm run deploy');
    await addShortcut('deploy', 'npm run deploy:prod', 'Updated deploy');

    const content = await readFile(join(flexDir, 'shortcuts.md'), 'utf8');
    // Should have the updated value, not two entries
    expect(content).toContain('npm run deploy:prod');
    // Count rows with "deploy" name
    const deployRows = content.split('\n').filter(
      (l) => l.startsWith('|') && l.includes('deploy') && !l.includes('Name')
    );
    expect(deployRows.length).toBe(1);
  });

  it('handles case-insensitive name matching for updates', async () => {
    await addShortcut('Deploy', 'npm run deploy');
    await addShortcut('deploy', 'npm run deploy:staging');

    const content = await readFile(join(flexDir, 'shortcuts.md'), 'utf8');
    // Should update, not create duplicate
    const dataRows = content
      .split('\n')
      .filter(
        (l) =>
          l.startsWith('|') &&
          !l.startsWith('| Name') &&
          !l.startsWith('|---') &&
          l.trim().length > 0
      );
    expect(dataRows.length).toBe(1);
  });

  it('syncs shortcuts to MEMORY.md inline section', async () => {
    await addShortcut('deploy', 'npm run deploy', 'Deploy to prod');

    const memory = await readFile(join(flexDir, 'MEMORY.md'), 'utf8');
    expect(memory).toContain('deploy');
    expect(memory).toContain('npm run deploy');
  });

  it('shortcut without description uses empty string', async () => {
    await addShortcut('build', 'npm run build');

    const content = await readFile(join(flexDir, 'shortcuts.md'), 'utf8');
    expect(content).toContain('| build | npm run build |');
  });
});
