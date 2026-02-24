// chrisflex lesson — Add a lesson learned
import dayjs from 'dayjs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as log from '../lib/logger.js';
import { getFlexDir, syncMemoryIndex } from '../lib/memory.js';

export async function lessonCommand(text: string, category?: string): Promise<void> {
  if (!text.trim()) {
    log.error('Please provide a lesson. Usage: chrisflex lesson "your lesson here"');
    return;
  }

  const flexDir = await getFlexDir();
  const lessonsPath = join(flexDir, 'lessons.md');

  // Read current lessons
  const content = await readFile(lessonsPath, 'utf8');
  const lines = content.split('\n');

  // Count existing lessons
  const existingLessons = lines.filter(
    (l) => l.startsWith('|') && !l.startsWith('| #') && !l.startsWith('|---')
  );
  const nextId = existingLessons.length + 1;
  const date = dayjs().format('YYYY-MM-DD');
  const cat = category ?? 'general';

  // Append new lesson row
  const newRow = `| ${nextId} | ${date} | ${cat} | ${text.trim()} |`;

  // Find the table header separator and append after last row
  const sepIndex = lines.findIndex((l) => l.startsWith('|---'));
  if (sepIndex === -1) {
    log.error('lessons.md has invalid format. Reinitialize with chrisflex init.');
    return;
  }

  lines.push(newRow);
  await writeFile(lessonsPath, lines.join('\n'));

  // Sync MEMORY.md index with new lesson
  await syncMemoryIndex(flexDir);

  log.success(`Lesson #${nextId} added: "${text.trim()}"`);
  log.info(`Category: ${cat} | Date: ${date}`);
}
