import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  findFlexDir,
  initializeFlexDir,
  addToGitignore,
  removeFromGitignore,
  readFlexFile,
  syncMemoryIndex,
} from '../src/lib/memory.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'chrisflex-test-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('initializeFlexDir', () => {
  it('creates .chrisflex/ with all expected files', async () => {
    const flexDir = await initializeFlexDir(tmpDir, 'test-project');

    expect(flexDir).toBe(join(tmpDir, '.chrisflex'));

    const expectedFiles = [
      'MEMORY.md',
      'state.md',
      'lessons.md',
      'shortcuts.md',
      'kanban.md',
      'backlog.md',
      'milestones.md',
      'conventions.md',
      'decisions.md',
      'config.json',
      'logs/INDEX.md',
    ];

    for (const file of expectedFiles) {
      const filePath = join(flexDir, file);
      await expect(access(filePath).then(() => true)).resolves.toBe(true);
    }
  });

  it('creates subdirectories: logs, screenshots, phases, quick', async () => {
    const flexDir = await initializeFlexDir(tmpDir, 'test-project');

    const expectedDirs = ['logs', 'screenshots', 'phases', 'quick'];
    for (const dir of expectedDirs) {
      const dirPath = join(flexDir, dir);
      await expect(access(dirPath).then(() => true)).resolves.toBe(true);
    }
  });

  it('MEMORY.md contains project name and directory', async () => {
    const flexDir = await initializeFlexDir(tmpDir, 'my-app');
    const content = await readFile(join(flexDir, 'MEMORY.md'), 'utf8');

    expect(content).toContain('my-app');
    expect(content).toContain(tmpDir);
    expect(content).toContain('## Top Lessons');
    expect(content).toContain('## Top Shortcuts');
    expect(content).toContain('## Coding Principles');
  });

  it('config.json has correct structure', async () => {
    const flexDir = await initializeFlexDir(tmpDir, 'my-app');
    const config = JSON.parse(await readFile(join(flexDir, 'config.json'), 'utf8'));

    expect(config.version).toBe('0.1.0');
    expect(config.project.name).toBe('my-app');
    expect(config.project.directory).toBe(tmpDir);
    expect(config.git.noCoAuthor).toBe(true);
    expect(config.git.commitModel).toBe('free');
    expect(config.git.autoBranch).toBe(false);
    expect(config.scaling.defaultMode).toBe('auto');
  });

  it('uses directory basename as default project name', async () => {
    const flexDir = await initializeFlexDir(tmpDir);
    const config = JSON.parse(await readFile(join(flexDir, 'config.json'), 'utf8'));

    // basename of tmpDir (e.g. chrisflex-test-XXXXX)
    expect(config.project.name).toBeTruthy();
    expect(config.project.name.length).toBeGreaterThan(0);
  });
});

describe('findFlexDir', () => {
  it('finds .chrisflex/ in same directory', async () => {
    await initializeFlexDir(tmpDir, 'test');
    const found = await findFlexDir(tmpDir);
    expect(found).toBe(join(tmpDir, '.chrisflex'));
  });

  it('finds .chrisflex/ by walking up from subdirectory', async () => {
    await initializeFlexDir(tmpDir, 'test');

    // Create a nested subdirectory
    const subDir = join(tmpDir, 'src', 'lib');
    const { mkdir } = await import('node:fs/promises');
    await mkdir(subDir, { recursive: true });

    const found = await findFlexDir(subDir);
    expect(found).toBe(join(tmpDir, '.chrisflex'));
  });

  it('returns null when .chrisflex/ not found', async () => {
    // Use a temp dir with no .chrisflex/
    const emptyDir = await mkdtemp(join(tmpdir(), 'chrisflex-empty-'));
    try {
      const found = await findFlexDir(emptyDir);
      expect(found).toBeNull();
    } finally {
      await rm(emptyDir, { recursive: true, force: true });
    }
  });
});

describe('addToGitignore / removeFromGitignore', () => {
  it('creates .gitignore if it does not exist', async () => {
    const added = await addToGitignore(tmpDir);
    expect(added).toBe(true);

    const content = await readFile(join(tmpDir, '.gitignore'), 'utf8');
    expect(content).toContain('.chrisflex/');
  });

  it('appends to existing .gitignore', async () => {
    await writeFile(join(tmpDir, '.gitignore'), 'node_modules/\n');

    const added = await addToGitignore(tmpDir);
    expect(added).toBe(true);

    const content = await readFile(join(tmpDir, '.gitignore'), 'utf8');
    expect(content).toContain('node_modules/');
    expect(content).toContain('.chrisflex/');
  });

  it('does not duplicate .chrisflex/ in .gitignore', async () => {
    await writeFile(join(tmpDir, '.gitignore'), '.chrisflex/\n');

    const added = await addToGitignore(tmpDir);
    expect(added).toBe(false);

    const content = await readFile(join(tmpDir, '.gitignore'), 'utf8');
    const count = content.split('.chrisflex/').length - 1;
    expect(count).toBe(1);
  });

  it('handles .gitignore without trailing newline', async () => {
    await writeFile(join(tmpDir, '.gitignore'), 'node_modules/');

    await addToGitignore(tmpDir);
    const content = await readFile(join(tmpDir, '.gitignore'), 'utf8');

    // Should have added newline before .chrisflex/
    expect(content).toBe('node_modules/\n.chrisflex/\n');
  });

  it('removes .chrisflex/ from .gitignore', async () => {
    await writeFile(join(tmpDir, '.gitignore'), 'node_modules/\n.chrisflex/\ndist/\n');

    const removed = await removeFromGitignore(tmpDir);
    expect(removed).toBe(true);

    const content = await readFile(join(tmpDir, '.gitignore'), 'utf8');
    expect(content).not.toContain('.chrisflex/');
    expect(content).toContain('node_modules/');
    expect(content).toContain('dist/');
  });

  it('returns false when .gitignore does not exist', async () => {
    const removed = await removeFromGitignore(tmpDir);
    expect(removed).toBe(false);
  });

  it('returns false when .chrisflex/ not in .gitignore', async () => {
    await writeFile(join(tmpDir, '.gitignore'), 'node_modules/\n');

    const removed = await removeFromGitignore(tmpDir);
    expect(removed).toBe(false);
  });
});

describe('readFlexFile', () => {
  it('reads file with content and line count', async () => {
    const flexDir = await initializeFlexDir(tmpDir, 'test');
    const result = await readFlexFile(flexDir, 'lessons.md');

    expect(result.content).toContain('# Lessons Learned');
    expect(result.lineCount).toBeGreaterThan(0);
  });

  it('returns empty for nonexistent file', async () => {
    const flexDir = await initializeFlexDir(tmpDir, 'test');
    const result = await readFlexFile(flexDir, 'nonexistent.md');

    expect(result.content).toBe('');
    expect(result.lineCount).toBe(0);
  });
});

describe('syncMemoryIndex', () => {
  it('updates MEMORY.md with lessons from lessons.md', async () => {
    const flexDir = await initializeFlexDir(tmpDir, 'test');

    // Add a lesson row to lessons.md
    const lessonsPath = join(flexDir, 'lessons.md');
    const lessonsContent = await readFile(lessonsPath, 'utf8');
    await writeFile(
      lessonsPath,
      lessonsContent + '| 1 | 2026-02-24 | general | Always test your code |\n'
    );

    await syncMemoryIndex(flexDir);

    const memory = await readFile(join(flexDir, 'MEMORY.md'), 'utf8');
    expect(memory).toContain('Always test your code');
  });

  it('updates MEMORY.md with shortcuts from shortcuts.md', async () => {
    const flexDir = await initializeFlexDir(tmpDir, 'test');

    // Add a shortcut row to shortcuts.md
    const scPath = join(flexDir, 'shortcuts.md');
    const scContent = await readFile(scPath, 'utf8');
    await writeFile(
      scPath,
      scContent + '| deploy | npm run deploy | Deploy to production | 2026-02-24 |\n'
    );

    await syncMemoryIndex(flexDir);

    const memory = await readFile(join(flexDir, 'MEMORY.md'), 'utf8');
    expect(memory).toContain('deploy');
    expect(memory).toContain('npm run deploy');
  });

  it('preserves MEMORY.md structure after sync', async () => {
    const flexDir = await initializeFlexDir(tmpDir, 'test');
    await syncMemoryIndex(flexDir);

    const memory = await readFile(join(flexDir, 'MEMORY.md'), 'utf8');
    expect(memory).toContain('## Top Lessons');
    expect(memory).toContain('## Top Shortcuts');
    expect(memory).toContain('## Coding Principles');
    expect(memory).toContain('## Current Task');
  });

  it('MEMORY.md stays under 200 lines after sync', async () => {
    const flexDir = await initializeFlexDir(tmpDir, 'test');

    // Add 10 lessons
    const lessonsPath = join(flexDir, 'lessons.md');
    let lessonsContent = await readFile(lessonsPath, 'utf8');
    for (let i = 1; i <= 10; i++) {
      lessonsContent += `| ${i} | 2026-02-24 | general | Lesson number ${i} about testing |\n`;
    }
    await writeFile(lessonsPath, lessonsContent);

    await syncMemoryIndex(flexDir);

    const memory = await readFile(join(flexDir, 'MEMORY.md'), 'utf8');
    const lineCount = memory.split('\n').length;
    expect(lineCount).toBeLessThanOrEqual(200);
  });
});
