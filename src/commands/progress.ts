// chrisflex progress — Show current project status
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import dayjs from 'dayjs';
import * as log from '../lib/logger.js';
import { getFlexDir, readFlexFile } from '../lib/memory.js';
import { getCurrentBranch, getRecentCommits, getModifiedFiles } from '../lib/git.js';

export async function progressCommand(): Promise<void> {
  const flexDir = await getFlexDir();

  log.banner('PROGRESS');

  // Read state
  const state = await readFlexFile(flexDir, 'state.md');
  const config = JSON.parse(await readFile(join(flexDir, 'config.json'), 'utf8'));

  // Project info
  log.heading('Project');
  log.keyValue('Name', config.project.name);
  log.keyValue('Directory', config.project.directory);
  log.keyValue('Initialized', dayjs(config.initialized).format('YYYY-MM-DD HH:mm'));

  // Current state
  log.heading('State');
  const stateLines = state.content.split('\n');
  const statusLine = stateLines.find((l: string) => l.startsWith('**Status:**'));
  const taskLine = stateLines.find((l: string) => l.startsWith('**Active task:**'));
  log.keyValue('Status', statusLine?.replace('**Status:**', '').trim() ?? 'Unknown');
  log.keyValue('Active Task', taskLine?.replace('**Active task:**', '').trim() ?? 'None');

  // Git status
  try {
    const branch = await getCurrentBranch();
    const modified = await getModifiedFiles();
    log.heading('Git');
    log.keyValue('Branch', branch);
    log.keyValue('Staged', String(modified.staged.length));
    log.keyValue('Modified', String(modified.unstaged.length));
    log.keyValue('Untracked', String(modified.untracked.length));

    const commits = await getRecentCommits(3);
    if (commits.length > 0) {
      log.heading('Recent Commits');
      for (const c of commits) {
        log.bullet(`${c.hash} ${c.message}`);
      }
    }
  } catch {
    log.info('Not a git repository');
  }

  // Lessons count
  const lessons = await readFlexFile(flexDir, 'lessons.md');
  const lessonCount = lessons.content
    .split('\n')
    .filter((l: string) => l.startsWith('|') && !l.startsWith('| #') && !l.startsWith('|---')).length;

  // Shortcuts count
  const shortcuts = await readFlexFile(flexDir, 'shortcuts.md');
  const shortcutCount = shortcuts.content
    .split('\n')
    .filter((l: string) => l.startsWith('|') && !l.startsWith('| Name') && !l.startsWith('|---')).length;

  log.heading('Memory');
  log.keyValue('Lessons', String(lessonCount));
  log.keyValue('Shortcuts', String(shortcutCount));
  log.keyValue('MEMORY.md lines', String(
    (await readFlexFile(flexDir, 'MEMORY.md')).lineCount
  ) + '/200');

  console.log('');
}
