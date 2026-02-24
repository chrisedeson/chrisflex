// chrisflex shortcut — Add a shortcut/alias
import dayjs from 'dayjs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as log from '../lib/logger.js';
import { getFlexDir, syncMemoryIndex } from '../lib/memory.js';

export async function shortcutCommand(
  name: string,
  value: string,
  description?: string
): Promise<void> {
  if (!name.trim() || !value.trim()) {
    log.error('Usage: chrisflex shortcut <name> <value> [-d "description"]');
    return;
  }

  const flexDir = await getFlexDir();
  const shortcutsPath = join(flexDir, 'shortcuts.md');

  // Read current shortcuts
  const content = await readFile(shortcutsPath, 'utf8');
  const lines = content.split('\n');

  // Check for duplicate name
  const existing = lines.find((l) => {
    const parts = l.split('|').map((p) => p.trim());
    return parts[1]?.toLowerCase() === name.toLowerCase();
  });

  if (existing) {
    log.warn(`Shortcut "${name}" already exists. Updating value.`);
    // Replace the existing line
    const idx = lines.indexOf(existing);
    const date = dayjs().format('YYYY-MM-DD');
    const desc = description || existing.split('|').map((p) => p.trim())[3] || '';
    lines[idx] = `| ${name} | ${value} | ${desc} | ${date} |`;
    await writeFile(shortcutsPath, lines.join('\n'));
  } else {
    // Append new shortcut row
    const date = dayjs().format('YYYY-MM-DD');
    const desc = description || '';
    const newRow = `| ${name} | ${value} | ${desc} | ${date} |`;
    lines.push(newRow);
    await writeFile(shortcutsPath, lines.join('\n'));
  }

  // Sync MEMORY.md index
  await syncMemoryIndex(flexDir);

  log.success(`Shortcut "${name}" → "${value}"`);
  if (description) log.info(`Description: ${description}`);
}
