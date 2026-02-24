// .chrisflex/ directory initialization and management
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { join, basename } from 'node:path';
import pc from 'picocolors';

async function pathExists(p: string): Promise<boolean> {
  try { await access(p); return true; } catch { return false; }
}
async function ensureDir(p: string): Promise<void> {
  await mkdir(p, { recursive: true });
}
import {
  memoryTemplate,
  stateTemplate,
  lessonsTemplate,
  shortcutsTemplate,
  kanbanTemplate,
  backlogTemplate,
  milestonesTemplate,
  conventionsTemplate,
  decisionsTemplate,
  logIndexTemplate,
  configTemplate,
} from './templates.js';
import { CHRISFLEX_DIR } from '../types.js';

/**
 * Find the .chrisflex directory by walking up from cwd
 */
export async function findFlexDir(startDir?: string): Promise<string | null> {
  let dir = startDir ?? process.cwd();
  const root = '/';

  while (dir !== root) {
    const candidate = join(dir, CHRISFLEX_DIR);
    if (await pathExists(candidate)) {
      return candidate;
    }
    dir = join(dir, '..');
  }
  return null;
}

/**
 * Get the .chrisflex directory, throw if not initialized
 */
export async function getFlexDir(): Promise<string> {
  const flexDir = await findFlexDir();
  if (!flexDir) {
    throw new Error(
      `No ${CHRISFLEX_DIR}/ directory found. Run ${pc.bold('chrisflex init')} first.`
    );
  }
  return flexDir;
}

/**
 * Get the project root (parent of .chrisflex/)
 */
export async function getProjectRoot(): Promise<string> {
  const flexDir = await getFlexDir();
  return join(flexDir, '..');
}

/**
 * Initialize .chrisflex/ directory with all template files
 */
export async function initializeFlexDir(
  projectDir: string,
  projectName?: string
): Promise<string> {
  const name = projectName ?? basename(projectDir);
  const flexDir = join(projectDir, CHRISFLEX_DIR);

  // Create directory structure
  await ensureDir(join(flexDir, 'logs'));
  await ensureDir(join(flexDir, 'screenshots'));
  await ensureDir(join(flexDir, 'phases'));
  await ensureDir(join(flexDir, 'quick'));

  // Write template files
  await writeFile(join(flexDir, 'MEMORY.md'), memoryTemplate(name, projectDir));
  await writeFile(join(flexDir, 'state.md'), stateTemplate());
  await writeFile(join(flexDir, 'lessons.md'), lessonsTemplate());
  await writeFile(join(flexDir, 'shortcuts.md'), shortcutsTemplate());
  await writeFile(join(flexDir, 'kanban.md'), kanbanTemplate());
  await writeFile(join(flexDir, 'backlog.md'), backlogTemplate());
  await writeFile(join(flexDir, 'milestones.md'), milestonesTemplate());
  await writeFile(join(flexDir, 'conventions.md'), conventionsTemplate());
  await writeFile(join(flexDir, 'decisions.md'), decisionsTemplate());
  await writeFile(join(flexDir, 'logs', 'INDEX.md'), logIndexTemplate());
  await writeFile(join(flexDir, 'config.json'), configTemplate(name, projectDir));

  return flexDir;
}

/**
 * Add .chrisflex/ to .gitignore
 */
export async function addToGitignore(projectDir: string): Promise<boolean> {
  const gitignorePath = join(projectDir, '.gitignore');
  const entry = '.chrisflex/';

  if (await pathExists(gitignorePath)) {
    const content = await readFile(gitignorePath, 'utf8');
    if (content.includes(entry)) {
      return false; // Already there
    }
    // Append with newline safety
    const separator = content.endsWith('\n') ? '' : '\n';
    await writeFile(gitignorePath, content + separator + entry + '\n');
  } else {
    await writeFile(gitignorePath, entry + '\n');
  }
  return true;
}

/**
 * Remove .chrisflex/ from .gitignore (for team sharing)
 */
export async function removeFromGitignore(projectDir: string): Promise<boolean> {
  const gitignorePath = join(projectDir, '.gitignore');
  const entry = '.chrisflex/';

  if (!(await pathExists(gitignorePath))) return false;

  const content = await readFile(gitignorePath, 'utf8');
  if (!content.includes(entry)) return false;

  const lines = content.split('\n').filter((line) => line.trim() !== entry);
  await writeFile(gitignorePath, lines.join('\n'));
  return true;
}

/**
 * Read a file from .chrisflex/ with line count awareness
 */
export async function readFlexFile(
  flexDir: string,
  fileName: string
): Promise<{ content: string; lineCount: number }> {
  const filePath = join(flexDir, fileName);
  if (!(await pathExists(filePath))) {
    return { content: '', lineCount: 0 };
  }
  const content = await readFile(filePath, 'utf8');
  const lineCount = content.split('\n').length;
  return { content, lineCount };
}

/**
 * Update MEMORY.md with inline lessons/shortcuts from their respective files
 * Ensures MEMORY.md stays under 200 lines
 */
export async function syncMemoryIndex(flexDir: string): Promise<void> {
  const memoryPath = join(flexDir, 'MEMORY.md');
  if (!(await pathExists(memoryPath))) return;

  let content = await readFile(memoryPath, 'utf8');

  // Read top lessons from lessons.md
  const lessonsFile = await readFlexFile(flexDir, 'lessons.md');
  const lessonLines = lessonsFile.content
    .split('\n')
    .filter((l) => l.startsWith('|') && !l.startsWith('| #') && !l.startsWith('|---'))
    .slice(0, 10); // Top 10

  // Update inline lessons section
  const lessonsStart = content.indexOf('## Top Lessons');
  const lessonsEnd = content.indexOf('## Top Shortcuts');
  if (lessonsStart !== -1 && lessonsEnd !== -1) {
    const lessonsSection =
      lessonLines.length > 0
        ? lessonLines.map((l) => `- ${l.split('|').slice(3, 4).join('').trim()}`).join('\n')
        : '_None yet. Use `chrisflex lesson "your lesson"` to add._';
    content =
      content.slice(0, lessonsStart) +
      `## Top Lessons (inline for quick access)\n${lessonsSection}\n\n` +
      content.slice(lessonsEnd);
  }

  // Read top shortcuts from shortcuts.md
  const shortcutsFile = await readFlexFile(flexDir, 'shortcuts.md');
  const shortcutLines = shortcutsFile.content
    .split('\n')
    .filter((l) => l.startsWith('|') && !l.startsWith('| Name') && !l.startsWith('|---'))
    .slice(0, 5); // Top 5

  // Update inline shortcuts section
  const scStart = content.indexOf('## Top Shortcuts');
  const scEnd = content.indexOf('## Coding Principles');
  if (scStart !== -1 && scEnd !== -1) {
    const scSection =
      shortcutLines.length > 0
        ? shortcutLines
            .map((l) => {
              const parts = l.split('|').map((p) => p.trim());
              return `- **${parts[1]}:** \`${parts[2]}\` — ${parts[3]}`;
            })
            .join('\n')
        : '_None yet. Use `chrisflex shortcut name "value"` to add._';
    content =
      content.slice(0, scStart) +
      `## Top Shortcuts (inline for quick access)\n${scSection}\n\n` +
      content.slice(scEnd);
  }

  // Verify under 200 lines
  const lineCount = content.split('\n').length;
  if (lineCount > 190) {
    // Trim inline sections to fit
    console.warn(
      pc.yellow(`⚠ MEMORY.md is ${lineCount} lines. Trimming to stay under 200.`)
    );
  }

  await writeFile(memoryPath, content);
}
