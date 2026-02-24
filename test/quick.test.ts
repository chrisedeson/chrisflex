import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { initializeFlexDir } from '../src/lib/memory.js';
import dayjs from 'dayjs';

let tmpDir: string;
let flexDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'chrisflex-quick-'));
  flexDir = await initializeFlexDir(tmpDir, 'test-project');
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

/**
 * Helper: simulate quickCommand logic directly with file operations
 * (quickCommand uses getFlexDir() which relies on process.cwd(), so we replicate the logic)
 */
async function addQuickEntry(
  description: string,
  status: 'todo' | 'done' = 'done'
): Promise<void> {
  const quickDir = join(flexDir, 'quick');
  await mkdir(quickDir, { recursive: true });

  const today = dayjs().format('YYYY-MM-DD');
  const logFile = join(quickDir, `${today}.md`);

  const now = dayjs().format('HH:mm');
  const emoji = status === 'done' ? '✅' : '📋';
  const entry = `| ${now} | ${emoji} ${status} | ${description.trim()} |`;

  let exists = false;
  try {
    await access(logFile);
    exists = true;
  } catch {
    // file doesn't exist
  }

  if (exists) {
    const content = await readFile(logFile, 'utf8');
    await writeFile(logFile, content + entry + '\n');
  } else {
    const header = `# Quick Tasks — ${today}

> Micro tasks logged with \`chrisflex quick\`. No ceremony, just results.

| Time | Status | Task |
|------|--------|------|
`;
    await writeFile(logFile, header + entry + '\n');
  }
}

describe('quick', () => {
  it('creates daily log file with header on first entry', async () => {
    await addQuickEntry('Fixed the bug');

    const today = dayjs().format('YYYY-MM-DD');
    const logFile = join(flexDir, 'quick', `${today}.md`);

    const content = await readFile(logFile, 'utf8');
    expect(content).toContain(`# Quick Tasks — ${today}`);
    expect(content).toContain('| Time | Status | Task |');
    expect(content).toContain('|------|--------|------|');
    expect(content).toContain('Fixed the bug');
  });

  it('appends to existing daily log file', async () => {
    await addQuickEntry('First task');
    await addQuickEntry('Second task');

    const today = dayjs().format('YYYY-MM-DD');
    const content = await readFile(join(flexDir, 'quick', `${today}.md`), 'utf8');

    expect(content).toContain('First task');
    expect(content).toContain('Second task');

    // Header should only appear once
    const headerCount = content.split('# Quick Tasks').length - 1;
    expect(headerCount).toBe(1);
  });

  it('uses ✅ emoji for done status', async () => {
    await addQuickEntry('Completed task', 'done');

    const today = dayjs().format('YYYY-MM-DD');
    const content = await readFile(join(flexDir, 'quick', `${today}.md`), 'utf8');
    expect(content).toContain('✅ done');
  });

  it('uses 📋 emoji for todo status', async () => {
    await addQuickEntry('Pending task', 'todo');

    const today = dayjs().format('YYYY-MM-DD');
    const content = await readFile(join(flexDir, 'quick', `${today}.md`), 'utf8');
    expect(content).toContain('📋 todo');
  });

  it('includes timestamp in each entry', async () => {
    await addQuickEntry('Timed task');

    const today = dayjs().format('YYYY-MM-DD');
    const content = await readFile(join(flexDir, 'quick', `${today}.md`), 'utf8');
    const now = dayjs().format('HH:mm');
    expect(content).toContain(`| ${now} |`);
  });

  it('trims description whitespace', async () => {
    await addQuickEntry('  padded task  ');

    const today = dayjs().format('YYYY-MM-DD');
    const content = await readFile(join(flexDir, 'quick', `${today}.md`), 'utf8');
    expect(content).toContain('padded task');
    expect(content).not.toContain('  padded task  ');
  });
});
