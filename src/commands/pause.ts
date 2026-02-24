// chrisflex pause — Save current state for session resumption
import dayjs from 'dayjs';
import { readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

async function pathExists(p: string): Promise<boolean> {
  try { await access(p); return true; } catch { return false; }
}
import * as log from '../lib/logger.js';
import { getFlexDir, readFlexFile } from '../lib/memory.js';
import { getCurrentBranch, getShortHash, getModifiedFiles } from '../lib/git.js';

export async function pauseCommand(message?: string): Promise<void> {
  const flexDir = await getFlexDir();
  const projectRoot = join(flexDir, '..');
  const continuePath = join(flexDir, '.continue-here.md');

  log.banner('PAUSE');

  // Gather current state
  const state = await readFlexFile(flexDir, 'state.md');
  const stateLines = state.content.split('\n');
  const statusLine = stateLines.find((l: string) => l.startsWith('**Status:**'));
  const taskLine = stateLines.find((l: string) => l.startsWith('**Active task:**'));
  const status = statusLine?.replace('**Status:**', '').trim() ?? 'Unknown';
  const activeTask = taskLine?.replace('**Active task:**', '').trim() ?? 'None';

  // Git info
  let branch = 'unknown';
  let hash = 'unknown';
  let modified: { staged: string[]; unstaged: string[]; untracked: string[] } = {
    staged: [],
    unstaged: [],
    untracked: [],
  };

  try {
    branch = await getCurrentBranch(projectRoot);
    hash = await getShortHash(projectRoot);
    modified = await getModifiedFiles(projectRoot);
  } catch {
    // Not in a git repo, that's fine
  }

  // Read kanban for in-progress items
  const kanban = await readFlexFile(flexDir, 'kanban.md');
  const inProgressItems = kanban.content
    .split('\n')
    .filter((l: string) => {
      const afterInProgress = kanban.content.indexOf('## 🟡 In Progress');
      const nextSection = kanban.content.indexOf('## 📋 Todo');
      if (afterInProgress === -1) return false;
      const lineIdx = kanban.content.indexOf(l);
      return lineIdx > afterInProgress && lineIdx < nextSection && l.startsWith('- ');
    });

  // Build .continue-here.md
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const content = `# Continue Here

> Saved by \`chrisflex pause\` at ${now}
> Resume with \`chrisflex resume\`

## When You Left Off
${message ? `**Note:** ${message}` : '_No note provided._'}

## Status
- **Status:** ${status}
- **Active Task:** ${activeTask}
- **Branch:** ${branch}
- **Last Commit:** ${hash}

## Unsaved Changes
${modified.staged.length > 0 ? `**Staged:** ${modified.staged.join(', ')}` : '_No staged changes._'}
${modified.unstaged.length > 0 ? `**Modified:** ${modified.unstaged.join(', ')}` : '_No unstaged changes._'}
${modified.untracked.length > 0 ? `**Untracked:** ${modified.untracked.join(', ')}` : '_No untracked files._'}

## In-Progress Tasks
${inProgressItems.length > 0 ? inProgressItems.join('\n') : '_None_'}

## Quick Context
_Add context about what you were thinking / next steps:_
${message ? message : ''}
`;

  await writeFile(continuePath, content);

  // Also update state.md to reflect paused
  const updatedState = state.content.replace(
    /\*\*Status:\*\* .*/,
    `**Status:** Paused (${now})`
  );
  await writeFile(join(flexDir, 'state.md'), updatedState);

  log.success('Session state saved to .continue-here.md');
  if (message) log.info(`Note: "${message}"`);
  log.info(`Branch: ${branch} @ ${hash}`);

  const totalChanges = modified.staged.length + modified.unstaged.length + modified.untracked.length;
  if (totalChanges > 0) {
    log.warn(`You have ${totalChanges} unsaved file(s). Consider committing before closing.`);
  }

  console.log('');
  log.info('Resume later with: chrisflex resume');
}
