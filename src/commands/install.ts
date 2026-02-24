// chrisflex install — Install slash commands and hooks into CLI tools
import { mkdir, writeFile, readFile, access, copyFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import * as log from '../lib/logger.js';

async function pathExists(p: string): Promise<boolean> {
  try { await access(p); return true; } catch { return false; }
}
async function ensureDir(p: string): Promise<void> {
  await mkdir(p, { recursive: true });
}

// Where each CLI tool stores its config/commands
interface ToolConfig {
  name: string;
  displayName: string;
  configDir: string; // relative to home
  workflowDir: string; // where slash commands go
  hookDir?: string; // where hooks go (if supported)
  hookFormat?: 'js' | 'json'; // hook file format
  prefix: string; // slash command prefix (e.g., "chrisflex" for /chrisflex:help)
}

function getToolConfigs(): ToolConfig[] {
  const home = homedir();
  return [
    {
      name: 'claude',
      displayName: 'Claude Code',
      configDir: join(home, '.claude'),
      workflowDir: join(home, '.claude', 'chrisflex', 'workflows'),
      hookDir: join(home, '.claude', 'hooks'),
      hookFormat: 'json',
      prefix: 'chrisflex',
    },
    {
      name: 'copilot',
      displayName: 'GitHub Copilot CLI',
      configDir: join(home, '.copilot'),
      workflowDir: join(home, '.copilot', 'chrisflex', 'workflows'),
      prefix: 'chrisflex',
    },
    {
      name: 'gemini',
      displayName: 'Gemini CLI',
      configDir: join(home, '.gemini'),
      workflowDir: join(home, '.gemini', 'chrisflex', 'workflows'),
      prefix: 'chrisflex',
    },
    {
      name: 'opencode',
      displayName: 'OpenCode',
      configDir: join(home, '.config', 'opencode'),
      workflowDir: join(home, '.config', 'opencode', 'chrisflex', 'workflows'),
      prefix: 'chrisflex',
    },
    {
      name: 'codex',
      displayName: 'Codex',
      configDir: join(home, '.codex'),
      workflowDir: join(home, '.codex', 'chrisflex', 'workflows'),
      prefix: 'chrisflex',
    },
    {
      name: 'droid',
      displayName: 'Factory Droid',
      configDir: join(home, '.droid'),
      workflowDir: join(home, '.droid', 'chrisflex', 'workflows'),
      prefix: 'chrisflex',
    },
    {
      name: 'cursor',
      displayName: 'Cursor Agent',
      configDir: join(home, '.cursor'),
      workflowDir: join(home, '.cursor', 'chrisflex', 'workflows'),
      prefix: 'chrisflex',
    },
  ];
}

// Find the chrisflex package's workflows directory
async function findPackageWorkflows(): Promise<string | null> {
  // Try relative to this file (when running from dist/)
  const candidates = [
    join(dirname(new URL(import.meta.url).pathname), '..', 'workflows'),
    join(dirname(new URL(import.meta.url).pathname), '..', '..', 'workflows'),
    join(process.cwd(), 'node_modules', 'chrisflex', 'workflows'),
  ];

  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function findPackageHooks(): Promise<string | null> {
  const candidates = [
    join(dirname(new URL(import.meta.url).pathname), '..', 'hooks'),
    join(dirname(new URL(import.meta.url).pathname), '..', '..', 'hooks'),
    join(process.cwd(), 'node_modules', 'chrisflex', 'hooks'),
  ];

  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }
  return null;
}

const WORKFLOW_FILES = [
  'help.md',
  'init.md',
  'quick.md',
  'progress.md',
  'pause-work.md',
  'resume-work.md',
  'add-lesson.md',
  'add-shortcut.md',
  'settings.md',
];

export async function installCommand(target?: string): Promise<void> {
  log.banner('INSTALL');

  const allTools = getToolConfigs();

  // Filter to specific target or all
  const tools = target
    ? allTools.filter((t) => t.name === target.toLowerCase())
    : allTools;

  if (target && tools.length === 0) {
    log.error(`Unknown target: "${target}"`);
    log.info(`Available targets: ${allTools.map((t) => t.name).join(', ')}`);
    return;
  }

  // Find workflow source files
  const workflowsDir = await findPackageWorkflows();
  if (!workflowsDir) {
    log.error('Could not find chrisflex workflows directory.');
    log.info('Make sure chrisflex is properly installed.');
    return;
  }

  const hooksDir = await findPackageHooks();

  let installed = 0;
  let skipped = 0;

  for (const tool of tools) {
    // Check if tool's config directory exists (tool is installed)
    const toolExists = await pathExists(tool.configDir);

    if (!toolExists) {
      log.info(`${tool.displayName}: not found (${tool.configDir})`);
      skipped++;
      continue;
    }

    log.heading(tool.displayName);

    // Create workflow directory
    await ensureDir(tool.workflowDir);

    // Copy workflow files
    let copiedCount = 0;
    for (const file of WORKFLOW_FILES) {
      const src = join(workflowsDir, file);
      const dest = join(tool.workflowDir, file);

      if (!(await pathExists(src))) {
        continue;
      }

      const content = await readFile(src, 'utf8');
      await writeFile(dest, content);
      copiedCount++;
    }

    log.success(`Installed ${copiedCount} workflow files → ${tool.workflowDir}`);

    // Install hooks (if supported and available)
    if (tool.hookDir && hooksDir) {
      await ensureDir(tool.hookDir);

      if (tool.name === 'claude') {
        // Claude Code uses a hooks.json configuration
        const hookSrc = join(hooksDir, 'chrisflex-context-monitor.js');
        if (await pathExists(hookSrc)) {
          const hookDest = join(tool.configDir, 'chrisflex', 'chrisflex-context-monitor.js');
          await ensureDir(dirname(hookDest));
          await copyFile(hookSrc, hookDest);

          // Create or update hooks configuration
          const hooksConfigPath = join(tool.configDir, 'hooks.json');
          let hooksConfig: Record<string, unknown> = {};

          if (await pathExists(hooksConfigPath)) {
            try {
              hooksConfig = JSON.parse(await readFile(hooksConfigPath, 'utf8'));
            } catch {
              // Invalid JSON, start fresh
            }
          }

          // Add chrisflex context monitor hook
          const hooks = (hooksConfig as Record<string, unknown[]>);
          if (!hooks.PostToolUse) {
            hooks.PostToolUse = [];
          }

          const existingIdx = (hooks.PostToolUse as Array<Record<string, unknown>>).findIndex(
            (h) => typeof h === 'object' && h !== null && String(h.command ?? '').includes('chrisflex-context-monitor')
          );

          const hookEntry = {
            command: `node ${hookDest}`,
            timeout: 5000,
          };

          if (existingIdx >= 0) {
            (hooks.PostToolUse as Array<Record<string, unknown>>)[existingIdx] = hookEntry;
          } else {
            (hooks.PostToolUse as Array<Record<string, unknown>>).push(hookEntry);
          }

          await writeFile(hooksConfigPath, JSON.stringify(hooksConfig, null, 2) + '\n');
          log.success('Installed context monitor hook');
        }
      }
    }

    installed++;
  }

  console.log('');

  if (installed > 0) {
    log.success(`Installed to ${installed} tool(s)`);
  }
  if (skipped > 0) {
    log.info(`${skipped} tool(s) not found (not installed on this system)`);
  }

  if (installed > 0) {
    console.log('');
    log.info('Slash commands available as /chrisflex:help, /chrisflex:quick, etc.');
    log.info('Use `chrisflex install <tool>` to install to a specific tool.');
  }
}
