import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { inspectFile, smartSearch, readLineRange } from '../src/lib/smart-search.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'chrisflex-search-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('inspectFile', () => {
  it('returns exists: false for nonexistent file', async () => {
    const result = await inspectFile(join(tmpDir, 'nope.md'));
    expect(result.exists).toBe(false);
    expect(result.size).toBe(0);
    expect(result.category).toBe('small');
  });

  it('categorizes small file (< 100 estimated lines)', async () => {
    // ~50 lines worth of content (50 * 80 = 4000 bytes)
    const content = 'x'.repeat(50 * 80);
    await writeFile(join(tmpDir, 'small.txt'), content);

    const result = await inspectFile(join(tmpDir, 'small.txt'));
    expect(result.exists).toBe(true);
    expect(result.category).toBe('small');
  });

  it('categorizes medium file (100-500 estimated lines)', async () => {
    // ~250 lines worth (250 * 80 = 20000 bytes)
    const content = 'x'.repeat(250 * 80);
    await writeFile(join(tmpDir, 'medium.txt'), content);

    const result = await inspectFile(join(tmpDir, 'medium.txt'));
    expect(result.exists).toBe(true);
    expect(result.category).toBe('medium');
  });

  it('categorizes large file (500-2000 estimated lines)', async () => {
    // ~1000 lines worth (1000 * 80 = 80000 bytes)
    const content = 'x'.repeat(1000 * 80);
    await writeFile(join(tmpDir, 'large.txt'), content);

    const result = await inspectFile(join(tmpDir, 'large.txt'));
    expect(result.exists).toBe(true);
    expect(result.category).toBe('large');
  });

  it('categorizes huge file (> 2000 estimated lines)', async () => {
    // ~3000 lines worth (3000 * 80 = 240000 bytes)
    const content = 'x'.repeat(3000 * 80);
    await writeFile(join(tmpDir, 'huge.txt'), content);

    const result = await inspectFile(join(tmpDir, 'huge.txt'));
    expect(result.exists).toBe(true);
    expect(result.category).toBe('huge');
  });

  it('returns accurate size in bytes', async () => {
    const content = 'Hello World'; // 11 bytes
    await writeFile(join(tmpDir, 'hello.txt'), content);

    const result = await inspectFile(join(tmpDir, 'hello.txt'));
    expect(result.size).toBe(11);
  });
});

describe('smartSearch', () => {
  it('returns empty array for nonexistent file', async () => {
    const results = await smartSearch(join(tmpDir, 'nope.md'), ['test']);
    expect(results).toEqual([]);
  });

  it('finds all keyword matches in small file', async () => {
    const content = [
      '# My Document',
      'This is about testing.',
      'Another line here.',
      'More testing stuff.',
      'Final line.',
    ].join('\n');
    await writeFile(join(tmpDir, 'small.md'), content);

    const results = await smartSearch(join(tmpDir, 'small.md'), ['testing']);
    expect(results.length).toBe(2);
    expect(results[0]!.lineNumber).toBe(2);
    expect(results[1]!.lineNumber).toBe(4);
    expect(results[0]!.content).toContain('testing');
  });

  it('matches case-insensitively', async () => {
    const content = 'Hello WORLD\nhello world\nHELLO World';
    await writeFile(join(tmpDir, 'case.md'), content);

    const results = await smartSearch(join(tmpDir, 'case.md'), ['hello']);
    expect(results.length).toBe(3);
  });

  it('matches multiple keywords (OR logic)', async () => {
    const content = [
      'line about apples',
      'line about bananas',
      'line about cherries',
      'line about apples and bananas',
    ].join('\n');
    await writeFile(join(tmpDir, 'fruits.md'), content);

    const results = await smartSearch(join(tmpDir, 'fruits.md'), ['apples', 'bananas']);
    expect(results.length).toBe(3); // lines 1, 2, and 4
  });

  it('does section-based search for large files', async () => {
    // Create a file large enough to be categorized as "large" (> 500 estimated lines)
    // We need > 500*80 = 40000 bytes. Use real lines with headers.
    const lines: string[] = [];
    lines.push('# Document Title');
    lines.push('Introduction text here');
    lines.push('');

    // Fill up to be "large" — ~600 real lines, padded to hit size threshold
    for (let i = 0; i < 600; i++) {
      lines.push(`Line ${i}: ${'x'.repeat(70)}`);
    }

    // Add a header with our keyword deep in the file
    lines.push('');
    lines.push('## Database Configuration');
    lines.push('Set up the database connection string here.');
    lines.push('Use PostgreSQL for production.');
    lines.push('');
    for (let i = 0; i < 100; i++) {
      lines.push(`More content ${i}: ${'y'.repeat(70)}`);
    }

    await writeFile(join(tmpDir, 'large.md'), lines.join('\n'));

    const results = await smartSearch(join(tmpDir, 'large.md'), ['database']);
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.content.includes('Database'))).toBe(true);
  });

  it('returns results sorted by line number', async () => {
    const content = [
      'third match on line 1',
      'no match here',
      'another match on line 3',
      'no match',
      'first match on line 5',
    ].join('\n');
    await writeFile(join(tmpDir, 'sorted.md'), content);

    const results = await smartSearch(join(tmpDir, 'sorted.md'), ['match']);
    for (let i = 1; i < results.length; i++) {
      expect(results[i]!.lineNumber).toBeGreaterThan(results[i - 1]!.lineNumber);
    }
  });
});

describe('readLineRange', () => {
  it('reads specific line range from file', async () => {
    const content = ['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5'].join('\n');
    await writeFile(join(tmpDir, 'range.txt'), content);

    const result = await readLineRange(join(tmpDir, 'range.txt'), 2, 4);
    expect(result).toBe('Line 2\nLine 3\nLine 4');
  });

  it('handles range beyond file end', async () => {
    const content = ['Line 1', 'Line 2', 'Line 3'].join('\n');
    await writeFile(join(tmpDir, 'short.txt'), content);

    const result = await readLineRange(join(tmpDir, 'short.txt'), 2, 10);
    expect(result).toBe('Line 2\nLine 3');
  });

  it('returns single line when start equals end', async () => {
    const content = ['A', 'B', 'C'].join('\n');
    await writeFile(join(tmpDir, 'single.txt'), content);

    const result = await readLineRange(join(tmpDir, 'single.txt'), 2, 2);
    expect(result).toBe('B');
  });
});
