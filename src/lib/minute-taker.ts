// Minute-taker: conversation logging with timestamps
import dayjs from 'dayjs';
import { mkdir, writeFile, readFile, appendFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import type { LogEntry, SessionIndex } from '../types.js';

async function pathExists(p: string): Promise<boolean> {
  try { await access(p); return true; } catch { return false; }
}
async function ensureDir(p: string): Promise<void> {
  await mkdir(p, { recursive: true });
}

/**
 * Get the current session log file path
 */
export function getSessionLogPath(logsDir: string, sessionStart?: Date): string {
  const ts = dayjs(sessionStart ?? new Date()).format('YYYY-MM-DD-HH-mm');
  return join(logsDir, `session-${ts}.md`);
}

/**
 * Start a new session log
 */
export async function startSession(
  logsDir: string,
  model: string,
  runtime: string,
  workDir: string,
  branch?: string
): Promise<string> {
  await ensureDir(logsDir);

  const now = new Date();
  const logPath = getSessionLogPath(logsDir, now);
  const header = `# Session Log: ${dayjs(now).format('YYYY-MM-DD HH:mm:ss')}

**Model:** ${model}
**Runtime:** ${runtime}
**Working Directory:** ${workDir}
${branch ? `**Branch:** ${branch}` : ''}

---

`;

  await writeFile(logPath, header);
  return logPath;
}

/**
 * Append a log entry to the current session
 */
export async function appendLogEntry(logPath: string, entry: LogEntry): Promise<void> {
  const now = dayjs(entry.timestamp);

  let line = `\n## ${now.format('HH:mm:ss')} — ${entry.role.toUpperCase()}`;
  if (entry.model) line += ` (${entry.model})`;
  if (entry.runtime) line += ` via ${entry.runtime}`;
  line += '\n\n';
  line += entry.content + '\n';

  if (entry.agentActivity) {
    const a = entry.agentActivity;
    line += '\n### Agent Activity\n';
    if (a.filesRead?.length) {
      line += a.filesRead.map((f) => `- **Read:** ${f}`).join('\n') + '\n';
    }
    if (a.filesEdited?.length) {
      line += a.filesEdited.map((f) => `- **Edit:** ${f}`).join('\n') + '\n';
    }
    if (a.commands?.length) {
      line += a.commands.map((c) => `- **Run:** \`${c}\``).join('\n') + '\n';
    }
    if (a.mcpCalls?.length) {
      line += a.mcpCalls.map((m) => `- **MCP:** ${m}`).join('\n') + '\n';
    }
  }

  if (entry.gitCommits?.length) {
    line += '\n### Git\n';
    line +=
      entry.gitCommits.map((c) => `- Commit: \`${c.hash}\` — "${c.message}"`).join('\n') +
      '\n';
  }

  line += '\n---\n';

  await appendFile(logPath, line);
}

/**
 * Update the session log index
 */
export async function updateLogIndex(
  logsDir: string,
  entry: SessionIndex
): Promise<void> {
  const indexPath = join(logsDir, 'INDEX.md');

  if (!(await pathExists(indexPath))) {
    await writeFile(
      indexPath,
      `# Session Log Index

> Quick lookup for past sessions. Newest first.

| Date | Model | Duration | Tasks | Files Modified | Log |
|------|-------|----------|-------|----------------|-----|
`
    );
  }

  const content = await readFile(indexPath, 'utf8');
  const lines = content.split('\n');

  // Find the header separator line (|---...) and insert after it
  const sepIndex = lines.findIndex((l) => l.startsWith('|---'));
  if (sepIndex === -1) return;

  const newRow = `| ${entry.date} | ${entry.model} | ${entry.duration} | ${entry.tasks} | ${entry.filesModified} | [${entry.logFile}](./${entry.logFile}) |`;

  lines.splice(sepIndex + 1, 0, newRow);
  await writeFile(indexPath, lines.join('\n'));
}
