// chrisflex quick — Log a quick task (anti-overkill)
// Small tasks don't need research, planning, or ceremony. Just do it and log it.
import dayjs from 'dayjs';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

async function pathExists(p: string): Promise<boolean> {
  try { await access(p); return true; } catch { return false; }
}
async function ensureDir(p: string): Promise<void> {
  await mkdir(p, { recursive: true });
}
import * as log from '../lib/logger.js';
import { getFlexDir } from '../lib/memory.js';

export async function quickCommand(
  description: string,
  status: 'todo' | 'done' = 'done'
): Promise<void> {
  if (!description.trim()) {
    log.error('Usage: chrisflex quick "what you did" [-s todo|done]');
    return;
  }

  const flexDir = await getFlexDir();
  const quickDir = join(flexDir, 'quick');
  await ensureDir(quickDir);

  // Quick log file — one per day
  const today = dayjs().format('YYYY-MM-DD');
  const logFile = join(quickDir, `${today}.md`);

  const now = dayjs().format('HH:mm');
  const emoji = status === 'done' ? '✅' : '📋';
  const entry = `| ${now} | ${emoji} ${status} | ${description.trim()} |`;

  if (await pathExists(logFile)) {
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

  // Also update state.md with last quick task
  const statePath = join(flexDir, 'state.md');
  if (await pathExists(statePath)) {
    const state = await readFile(statePath, 'utf8');
    const nowFull = dayjs().format('YYYY-MM-DD HH:mm');
    const updated = state.replace(
      /\*\*Last updated:\*\* .*/,
      `**Last updated:** ${nowFull}`
    );
    await writeFile(statePath, updated);
  }

  if (status === 'done') {
    log.success(`Done: ${description.trim()}`);
  } else {
    log.info(`Todo: ${description.trim()}`);
  }
  log.info(`Logged to quick/${today}.md`);
}
