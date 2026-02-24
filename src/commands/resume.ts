// chrisflex resume — Restore state from last pause
import { readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import dayjs from 'dayjs';

async function pathExists(p: string): Promise<boolean> {
  try { await access(p); return true; } catch { return false; }
}
import * as log from '../lib/logger.js';
import { getFlexDir, readFlexFile } from '../lib/memory.js';
import { getCurrentBranch, getShortHash, getModifiedFiles } from '../lib/git.js';

export async function resumeCommand(): Promise<void> {
  const flexDir = await getFlexDir();
  const projectRoot = join(flexDir, '..');
  const continuePath = join(flexDir, '.continue-here.md');

  log.banner('RESUME');

  if (!(await pathExists(continuePath))) {
    log.info('No saved state found. Nothing to resume.');
    log.info('Use `chrisflex pause` to save your state before ending a session.');
    return;
  }

  // Read the saved state
  const content = await readFile(continuePath, 'utf8');
  console.log(content);

  // Show current state vs saved state
  log.heading('Current State (now)');

  try {
    const branch = await getCurrentBranch(projectRoot);
    const hash = await getShortHash(projectRoot);
    const modified = await getModifiedFiles(projectRoot);

    log.keyValue('Branch', branch);
    log.keyValue('Commit', hash);
    log.keyValue('Staged', String(modified.staged.length));
    log.keyValue('Modified', String(modified.unstaged.length));
    log.keyValue('Untracked', String(modified.untracked.length));
  } catch {
    log.info('Not in a git repository');
  }

  // Update state.md back to active
  const state = await readFlexFile(flexDir, 'state.md');
  const now = dayjs().format('YYYY-MM-DD HH:mm');
  const updatedState = state.content.replace(
    /\*\*Status:\*\* .*/,
    `**Status:** Active (resumed ${now})`
  );
  await writeFile(join(flexDir, 'state.md'), updatedState);

  console.log('');
  log.success('State restored. You\'re back in action.');
  log.info('The .continue-here.md file is preserved until your next pause.');
}
