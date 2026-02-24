import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { initializeFlexDir } from '../src/lib/memory.js';

// We can't call lessonCommand directly because it uses getFlexDir() which reads process.cwd().
// Instead, we test the underlying logic: read lessons.md, append row, syncMemoryIndex.
import { syncMemoryIndex, readFlexFile } from '../src/lib/memory.js';
import { writeFile } from 'node:fs/promises';

let tmpDir: string;
let flexDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'chrisflex-lesson-'));
  flexDir = await initializeFlexDir(tmpDir, 'test-project');
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

/**
 * Helper: simulate what lessonCommand does (append lesson row + sync)
 */
async function addLesson(text: string, category = 'general'): Promise<void> {
  const lessonsPath = join(flexDir, 'lessons.md');
  const content = await readFile(lessonsPath, 'utf8');
  const lines = content.split('\n');

  const existingLessons = lines.filter(
    (l) => l.startsWith('|') && !l.startsWith('| #') && !l.startsWith('|---')
  );
  const nextId = existingLessons.length + 1;
  const date = '2026-02-24'; // fixed for test determinism

  const newRow = `| ${nextId} | ${date} | ${category} | ${text.trim()} |`;
  lines.push(newRow);
  await writeFile(lessonsPath, lines.join('\n'));
  await syncMemoryIndex(flexDir);
}

describe('lesson', () => {
  it('appends a lesson row to lessons.md', async () => {
    await addLesson('Always check file sizes before reading');

    const content = await readFile(join(flexDir, 'lessons.md'), 'utf8');
    expect(content).toContain('Always check file sizes before reading');
    expect(content).toContain('| 1 |');
  });

  it('increments lesson numbering correctly', async () => {
    await addLesson('First lesson');
    await addLesson('Second lesson');
    await addLesson('Third lesson');

    const content = await readFile(join(flexDir, 'lessons.md'), 'utf8');
    expect(content).toContain('| 1 |');
    expect(content).toContain('| 2 |');
    expect(content).toContain('| 3 |');
    expect(content).toContain('First lesson');
    expect(content).toContain('Second lesson');
    expect(content).toContain('Third lesson');
  });

  it('defaults category to "general"', async () => {
    await addLesson('Default category lesson');

    const content = await readFile(join(flexDir, 'lessons.md'), 'utf8');
    expect(content).toContain('| general |');
  });

  it('uses custom category when provided', async () => {
    await addLesson('Git-related lesson', 'git');

    const content = await readFile(join(flexDir, 'lessons.md'), 'utf8');
    expect(content).toContain('| git |');
  });

  it('syncs lessons to MEMORY.md inline section', async () => {
    await addLesson('Memory should contain this');

    const memory = await readFile(join(flexDir, 'MEMORY.md'), 'utf8');
    expect(memory).toContain('Memory should contain this');
  });

  it('MEMORY.md shows up to 10 lessons inline', async () => {
    for (let i = 1; i <= 12; i++) {
      await addLesson(`Lesson ${i}`);
    }

    const memory = await readFile(join(flexDir, 'MEMORY.md'), 'utf8');
    // Should contain lessons 1-10 inline (first 10)
    expect(memory).toContain('Lesson 1');
    expect(memory).toContain('Lesson 10');
  });
});
