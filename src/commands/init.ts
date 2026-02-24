// chrisflex init — Initialize .chrisflex/ in current project
import { confirm, text, isCancel } from '@clack/prompts';
import { access } from 'node:fs/promises';
import { join, basename } from 'node:path';

async function pathExists(p: string): Promise<boolean> {
  try { await access(p); return true; } catch { return false; }
}
import * as log from '../lib/logger.js';
import {
  initializeFlexDir,
  addToGitignore,
  removeFromGitignore,
} from '../lib/memory.js';
import { isGitRepo } from '../lib/git.js';
import { CHRISFLEX_DIR } from '../types.js';

export async function initCommand(): Promise<void> {
  const cwd = process.cwd();
  const flexDir = join(cwd, CHRISFLEX_DIR);

  log.banner('INIT');

  // Check if already initialized
  if (await pathExists(flexDir)) {
    log.warn(`${CHRISFLEX_DIR}/ already exists in this directory.`);
    const overwrite = await confirm({
      message: 'Reinitialize? This will NOT delete existing files.',
    });
    if (isCancel(overwrite) || !overwrite) {
      log.info('Cancelled.');
      return;
    }
  }

  // Get project name
  const defaultName = basename(cwd);
  const projectName = await text({
    message: 'Project name?',
    defaultValue: defaultName,
    placeholder: defaultName,
  });

  if (isCancel(projectName)) {
    log.info('Cancelled.');
    return;
  }

  const name = (projectName as string) || defaultName;

  // Initialize
  await initializeFlexDir(cwd, name);
  log.success(`Created ${CHRISFLEX_DIR}/ directory`);

  // Git handling
  const inGitRepo = await isGitRepo(cwd);
  if (inGitRepo) {
    const added = await addToGitignore(cwd);
    if (added) {
      log.success(`Added ${CHRISFLEX_DIR}/ to .gitignore`);
    } else {
      log.info(`${CHRISFLEX_DIR}/ already in .gitignore`);
    }

    const includeInGit = await confirm({
      message: 'Include .chrisflex/ in git for team access? (removes from .gitignore)',
    });

    if (!isCancel(includeInGit) && includeInGit) {
      await removeFromGitignore(cwd);
      log.success('Removed .chrisflex/ from .gitignore — team can access it');
    }
  }

  // Summary
  console.log('');
  log.heading('Initialized:');
  log.bullet(`MEMORY.md — master index (stays under 200 lines)`);
  log.bullet(`state.md — current status`);
  log.bullet(`lessons.md — things learned the hard way`);
  log.bullet(`shortcuts.md — SSH aliases, custom commands`);
  log.bullet(`kanban.md — task board`);
  log.bullet(`conventions.md — coding rules`);
  log.bullet(`decisions.md — decision log`);
  log.bullet(`logs/ — session logs (minute-taker)`);
  console.log('');
  log.info('Use `chrisflex lesson "your lesson"` to start adding lessons.');
  log.info('Use `chrisflex shortcut name "value"` to save shortcuts.');
  log.info('Use `chrisflex progress` to check status.');
}
