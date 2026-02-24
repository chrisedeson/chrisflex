# Phase 1: Foundation - Research

**Researched:** 2026-02-24
**Domain:** TypeScript CLI tool for AI coding workflow management with persistent memory
**Confidence:** HIGH

## Summary

This research covers everything needed to build ChrisFlex — a lean, cost-efficient AI coding workflow manager that solves the context compaction and memory loss problems plaguing tools like Claude Code, GitHub Copilot, and Gemini CLI. The tool will be a TypeScript CLI published to npm as `chrisflex` (confirmed available on npm registry as of 2026-02-24).

The standard approach is: Commander.js v14 for CLI parsing, tsup v8 for building, a slash-command system inspired by GSD but dramatically lighter, and a `.chrisflex/` directory per project that stores all memory, logs, state, and documentation in small, focused files that each stay under 200 lines (solving Claude Code's 200-line doc limit).

The key innovation over GSD is **task-scale detection** — small tasks skip research and planning overhead entirely, while large projects get the full pipeline. The key innovation over bare Claude Code is **file-based memory that survives compaction** — instead of relying on lossy context summarization, ChrisFlex writes everything to disk in structured files that can be re-read on demand.

**Primary recommendation:** Build a minimal CLI with Commander.js that installs slash-command markdown files into AI CLI tool config directories (like GSD does), manages a `.chrisflex/` directory for persistent memory, and uses a context monitor hook to detect and survive compaction events.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `commander` | ^14.0.3 | CLI argument parsing & subcommands | Zero deps, 100M+ weekly downloads, used by create-next-app, Svelte CLI. Subcommands are first-class. |
| `@clack/prompts` | ^1.0.1 | Interactive terminal UI (spinners, confirmations) | Hit 1.0 stable. Used by create-vite, Svelte CLI. Beautiful output by default. |
| `picocolors` | ^1.1.1 | Terminal colors | 2.6KB, fastest benchmarks, used by Vite ecosystem |
| `simple-git` | ^3.32.2 | Git operations | Wraps system git binary, TypeScript types included, actively maintained |
| `zod` | ^4.3.6 | Config/input/schema validation | TypeScript-first with automatic type inference. Standard for validation. |
| `dayjs` | ^1.11.19 | Date/time handling (timestamps for minute-taker) | 2.9KB core, chainable API, plugin system for formats |
| `yaml` | ^2.8.2 | YAML parsing (Copilot session files) | Full YAML 1.2 spec, used by npm ecosystem |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `tinyglobby` | ^0.2.15 | File glob matching | Finding session files, searching .chrisflex/ directory |
| `tinyexec` | ^1.0.2 | Process execution | Spawning cheap model processes, running dev servers |
| `fs-extra` | ^11.3.3 | Enhanced file ops (ensureDir, copy, outputJson) | When creating .chrisflex/ directory structure |

### Dev Dependencies
| Library | Version | Purpose |
|---------|---------|---------|
| `tsup` | ^8.5.1 | Build/bundle (esbuild-powered, handles shebangs) |
| `typescript` | ^5.9.3 | Type checking |
| `vitest` | ^4.1.0 | Testing |
| `@types/node` | ^22.15.0 | Node.js type definitions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Commander.js | yargs v18 | yargs is heavier, Commander has simpler subcommand model |
| @clack/prompts | @inquirer/prompts v8 | inquirer is modular but more verbose, clack gives polished UX with less code |
| picocolors | chalk v5 | chalk is 44KB vs 2.6KB, overkill for CLI styling |
| tsup | tsdown v0.20 | tsdown is rolldown-based but pre-1.0, revisit when stable |
| dayjs | date-fns | date-fns is 140KB tree-shaken, overkill for timestamp formatting |

### Installation
```bash
npm install commander @clack/prompts picocolors simple-git zod dayjs yaml tinyglobby tinyexec fs-extra
npm install -D tsup typescript vitest @types/node
```

## Architecture Patterns

### Recommended Project Structure
```
chrisflex/
├── src/
│   ├── cli.ts                  # Entry point: shebang, Commander setup, registers commands
│   ├── index.ts                # Programmatic API exports
│   ├── commands/               # One file per slash command
│   │   ├── init.ts             # chrisflex init (creates .chrisflex/)
│   │   ├── quick.ts            # chrisflex quick (fast task execution)
│   │   ├── progress.ts         # chrisflex progress (show status)
│   │   ├── pause.ts            # chrisflex pause (save state for resumption)
│   │   ├── resume.ts           # chrisflex resume (restore state)
│   │   ├── log.ts              # chrisflex log (view minute-taker entries)
│   │   ├── lesson.ts           # chrisflex lesson (add to lessons learned)
│   │   ├── shortcut.ts         # chrisflex shortcut (add to shortcuts)
│   │   └── install.ts          # chrisflex install (install into CLI tools)
│   ├── lib/
│   │   ├── memory.ts           # .chrisflex/ directory management
│   │   ├── minute-taker.ts     # Conversation logging with timestamps
│   │   ├── smart-search.ts     # Heuristic file search (check length, read sections)
│   │   ├── context-monitor.ts  # Compaction detection and state saving
│   │   ├── git.ts              # Git operations (no AI co-author)
│   │   ├── config.ts           # Config file reading/writing
│   │   ├── session-reader.ts   # Read sessions from Claude/Copilot/Gemini/etc.
│   │   └── logger.ts           # Styled output helpers
│   └── types.ts                # Shared types/interfaces
├── workflows/                  # Slash command markdown files (installed into CLIs)
│   ├── help.md
│   ├── init.md
│   ├── quick.md
│   ├── progress.md
│   ├── pause-work.md
│   ├── resume-work.md
│   ├── add-lesson.md
│   ├── add-shortcut.md
│   └── settings.md
├── agents/                     # Agent definition markdown files
│   ├── chrisflex-executor.md
│   └── chrisflex-planner.md
├── hooks/                      # Claude Code hooks
│   └── chrisflex-context-monitor.js
├── templates/                  # File templates for .chrisflex/ initialization
├── test/
├── dist/                       # Built output (gitignored)
├── tsup.config.ts
├── tsconfig.json
├── vitest.config.ts
├── package.json
└── LICENSE
```

### Pattern 1: .chrisflex/ Directory (Per-Project Memory)
**What:** Every project gets a `.chrisflex/` directory that stores all memory, state, logs, and documentation in small focused files.
**When to use:** On `chrisflex init` or when any chrisflex command is first run in a project.

**Directory Structure:**
```
.chrisflex/
├── MEMORY.md                   # Master index file (MUST stay under 200 lines)
├── state.md                    # Current status, active task, what's happening now
├── decisions.md                # Key decisions made and rationale
├── lessons.md                  # "Burned stove" list — things learned the hard way
├── shortcuts.md                # SSH aliases, custom commands, project-specific shortcuts
├── kanban.md                   # Active tasks: todo, in-progress, done, blocked
├── backlog.md                  # Future ideas, deferred features
├── milestones.md               # Milestone tracking with dates
├── conventions.md              # Coding standards, naming patterns, project rules
├── stack.md                    # Tech stack documentation
├── logs/
│   ├── session-YYYY-MM-DD-HH-MM.md  # Minute-taker log per session
│   └── INDEX.md                      # Session index for fast lookup
├── screenshots/                # Screenshot iteration history
│   └── YYYY-MM-DD-HH-MM-SS.jpg
├── phases/                     # Phase-based work (for larger projects)
│   └── XX-name/
│       ├── plan.md
│       └── summary.md
└── quick/                      # Quick task history
    └── NNN-slug/
        ├── plan.md
        └── summary.md
```

**Critical Design Rule:** MEMORY.md is the master index that stays under 200 lines. It contains:
- Project name and description (2 lines)
- Tech stack summary (5 lines)
- Current status pointer → state.md (1 line)
- Lessons pointer → lessons.md (1 line)
- Shortcuts pointer → shortcuts.md (1 line)
- Conventions pointer → conventions.md (1 line)
- Active kanban pointer → kanban.md (1 line)
- Recent session log pointer → logs/INDEX.md (1 line)
- Top 10 most critical lessons (inline, 10-20 lines)
- Top 5 most-used shortcuts (inline, 5-10 lines)
- Current phase/task (5 lines)
- Coding principles: simplicity > cleverness, DRY, YAGNI (3 lines)

Everything else lives in separate files. This solves the 200-line limit.

### Pattern 2: Context Monitor Hook (Compaction Survival)
**What:** A PostToolUse hook (like GSD's `gsd-context-monitor.js`) that monitors context usage and forces state saves before compaction destroys knowledge.
**When to use:** Always active when using Claude Code.

**How it works:**
```
Statusline Hook (chrisflex-statusline.js)
    | writes context metrics to
    v
/tmp/chrisflex-ctx-{session_id}.json
    ^ reads
    |
Context Monitor (chrisflex-context-monitor.js, PostToolUse)
    | when remaining <= 35%: "WRAP UP, save state"
    | when remaining <= 25%: "STOP NOW, save everything"
    v
additionalContext → Agent sees warning → runs /chrisflex:pause
```

**Thresholds (from GSD, proven effective):**
- Normal: > 35% remaining — no action
- WARNING: <= 35% remaining — wrap up current task, save state
- CRITICAL: <= 25% remaining — stop immediately, force state dump

**Pre-compaction save protocol:**
1. Write current state to `.chrisflex/state.md`
2. Flush minute-taker log to `.chrisflex/logs/session-*.md`
3. Update `.chrisflex/MEMORY.md` index
4. Create `.chrisflex/.continue-here.md` handoff file
5. Commit all .chrisflex/ changes

### Pattern 3: Task Scale Detection (Anti-Overkill)
**What:** Detect whether the user wants a quick fix or a full project, and scale the workflow accordingly.
**When to use:** On every user request.

**Scale levels:**
| Level | Detection | Workflow |
|-------|-----------|----------|
| **Micro** | "fix this", "rename X", "add a comment", single file change | Direct edit, no planning, no research. Just do it. |
| **Quick** | "add feature X", "update the API", involves 1-5 files | Create 1-3 task plan, execute, commit. No research agents. |
| **Full** | "build new module", "refactor the auth system", involves 5+ files | Research → Plan → Execute → Verify pipeline |
| **Project** | "build an app", "create from scratch" | Full GSD-style: roadmap, phases, milestones |

**Detection heuristic:**
- Count files likely affected (mentioned or implied)
- Check if user said "quick", "just", "simple", "small" → scale down
- Check if user said "build", "create", "redesign", "refactor" → scale up
- When in doubt, ASK the user: "Is this a quick fix or something bigger?"

### Pattern 4: Minute-Taker (Conversation Logging)
**What:** A continuous append-only log that captures every conversation between user and LLM with exact timestamps.
**When to use:** Always running during any chrisflex session.

**Log format:**
```markdown
# Session Log: 2026-02-24 15:30:00

**Model:** claude-opus-4.6 via opencode
**Working Directory:** /home/chris/myproject
**Branch:** feature/auth

---

## 15:30:00 — USER
Fix the login button padding on the dashboard page.

## 15:30:15 — ASSISTANT (claude-opus-4.6)
I'll fix the login button padding. Looking at `src/components/Dashboard.tsx`...

### Agent Activity
- **Read:** src/components/Dashboard.tsx (45 lines)
- **Edit:** src/components/Dashboard.tsx (line 23, changed padding from 8px to 16px)

## 15:30:45 — ASSISTANT (claude-opus-4.6)
Fixed. The padding was 8px, changed to 16px to match the design system.

### Git
- Commit: `abc1234` — "fix: dashboard login button padding"

---
```

**Index file (`logs/INDEX.md`):**
```markdown
# Session Index

| Date | Model | Duration | Tasks | Files Modified | Log |
|------|-------|----------|-------|----------------|-----|
| 2026-02-24 15:30 | claude-opus-4.6 | 12min | 3 | 5 | [session-2026-02-24-15-30.md](./session-2026-02-24-15-30.md) |
```

### Pattern 5: Smart File Search (Heuristic Reading)
**What:** Never read entire large files. Check length first, read only relevant sections.
**When to use:** Whenever chrisflex needs to search its own logs or project files.

**Algorithm:**
1. Check file size/line count before reading
2. If < 100 lines: read entire file
3. If 100-500 lines: read first 20 lines (header/TOC) + search for keywords
4. If > 500 lines: read INDEX.md or table of contents, then read specific line ranges
5. For minute-taker logs: use the INDEX.md to find the right session file, then search within it
6. Delegate search to cheap models when possible (Claude Haiku 4.5, GPT-4.1 free tier)

### Pattern 6: Slash Command Markdown Format
**What:** Each slash command is a markdown file that gets installed into AI CLI tool config directories.
**When to use:** For all chrisflex commands.

**Format (based on GSD's proven pattern):**
```markdown
<purpose>
One-sentence description of what this command does.
</purpose>

<process>

<step name="detect" priority="required">
First, figure out the current state...
</step>

<step name="execute" priority="required">
Do the actual work...
</step>

<step name="confirm" priority="required">
Show the user what was done...
</step>

</process>

<success_criteria>
- [ ] Thing 1 happened
- [ ] Thing 2 happened
</success_criteria>
```

### Anti-Patterns to Avoid
- **One giant MEMORY.md:** Never let any single file exceed 200 lines. Split into focused files.
- **Over-researching small tasks:** If a task is < 10 lines of code, skip research entirely. Just do it.
- **AI co-author attribution:** Never add "Co-authored-by: Claude" or similar to git commits.
- **Reading entire log files:** Always check file length first, use index files for lookup.
- **Spawning agents for micro-tasks:** Agents are expensive. Only spawn for Quick+ scale tasks.
- **Lossy compaction reliance:** Never rely on Claude's compaction to preserve state. Always write to disk.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CLI argument parsing | Custom arg parser | Commander.js v14 | Subcommands, help generation, TypeScript types — all free |
| Git operations | Raw `child_process.exec('git ...')` | simple-git v3 | Error handling, TypeScript types, promise-based API |
| Interactive prompts | Custom readline interface | @clack/prompts v1 | Spinners, styled output, cancellation handling |
| YAML parsing | Regex or custom parser | yaml v2 | Full YAML 1.2 spec, handles edge cases you won't think of |
| Schema validation | Custom type checks | Zod v4 | Type inference, parse don't validate, error messages |
| File globbing | Custom fs.readdir recursion | tinyglobby v0.2 | Handles symlinks, ignore patterns, performance |
| Process execution | Raw child_process | tinyexec v1 | Cross-platform, proper signal handling |
| Date formatting | Custom string manipulation | dayjs v1 | Timezone-aware, relative time, plugins |
| Browser screenshots | Custom CDP client | Playwright MCP (existing) | Microsoft maintains it, handles browser lifecycle |
| Session reading from other CLIs | Custom parsers from scratch | Study cli-continues patterns | They've already reverse-engineered all 7 formats |

**Key insight:** ChrisFlex's value is in the WORKFLOW and MEMORY, not in reimplementing solved problems. Every hour spent building a custom YAML parser is an hour not spent on the compaction solution.

## Common Pitfalls

### Pitfall 1: The 200-Line Trap
**What goes wrong:** MEMORY.md grows past 200 lines, Claude Code stops loading the overflow into its system prompt, and the AI "forgets" critical project rules.
**Why it happens:** Developers keep adding to one file instead of splitting into focused files.
**How to avoid:** Hard limit of 200 lines on MEMORY.md. Use it as an INDEX that points to other files. Auto-warn if approaching limit.
**Warning signs:** AI starts forgetting project conventions, SSH aliases, naming patterns.

### Pitfall 2: Lossy Compaction Destroying State
**What goes wrong:** Claude Code compacts the conversation, summarizing away specific variable names, exact configurations, and small details.
**Why it happens:** Compaction is designed to capture INTENT not SYNTAX. It trades precision for brevity.
**How to avoid:** Context monitor hook detects approaching compaction, forces state save to disk BEFORE compaction happens. On session resume, re-read state from disk.
**Warning signs:** AI starts using wrong variable names, wrong file paths, or forgetting recent decisions after a long session.

### Pitfall 3: Token Waste on Research
**What goes wrong:** GSD-style tools burn 50k+ tokens just to research and plan a 5-line code change.
**Why it happens:** One-size-fits-all workflow treats every task as a full project.
**How to avoid:** Task scale detection (micro/quick/full/project). Micro tasks skip ALL overhead. Quick tasks get minimal planning.
**Warning signs:** The AI asks 10 questions before making a one-line change. Multiple research agents spawn for a simple rename.

### Pitfall 4: Context Rot in Long Sessions
**What goes wrong:** Even within the context window, the AI's attention to middle content degrades. It remembers the beginning and end but forgets the middle.
**Why it happens:** Transformer attention dilution across thousands of tokens.
**How to avoid:** Keep sessions short. Use sub-agents with fresh context windows for each task (GSD's proven approach). Write critical decisions to disk immediately.
**Warning signs:** AI starts contradicting earlier decisions, re-asking questions that were already answered.

### Pitfall 5: ESM/CJS Module Confusion
**What goes wrong:** Build produces CJS when ESM is expected, or import paths are wrong, or `__dirname` doesn't exist in ESM.
**Why it happens:** Node.js ecosystem still has mixed ESM/CJS, and many tutorials show outdated patterns.
**How to avoid:** Use `"type": "module"` in package.json, `"module": "NodeNext"` in tsconfig, tsup with `format: ['esm']`. Use `import.meta.url` instead of `__dirname`. Use `.mjs` extensions for output.
**Warning signs:** `ERR_REQUIRE_ESM`, `__dirname is not defined`, `Cannot find module` errors.

### Pitfall 6: npm Publishing Mistakes
**What goes wrong:** Published package includes source files, test files, or node_modules. Or `bin` field points to wrong file. Or shebang is missing.
**Why it happens:** Forgetting to set `files` whitelist, or not testing with `npm pack` before publishing.
**How to avoid:** Use `"files": ["dist"]` in package.json (whitelist, not blacklist). Add `#!/usr/bin/env node` shebang to cli.ts (tsup preserves it). Always test with `npm pack --dry-run` before publishing.
**Warning signs:** Package is 50MB instead of 500KB. `npx chrisflex` fails with "permission denied" or "not found".

## Code Examples

### CLI Entry Point (src/cli.ts)
```typescript
#!/usr/bin/env node
// Source: Commander.js v14 + standard CLI patterns
import { Command } from 'commander';
import { version } from '../package.json' with { type: 'json' };

const program = new Command();

program
  .name('chrisflex')
  .description('Lean AI coding workflow manager with persistent memory')
  .version(version);

program
  .command('init')
  .description('Initialize .chrisflex/ in current project')
  .action(async () => {
    const { initCommand } = await import('./commands/init.js');
    await initCommand();
  });

program
  .command('quick [description...]')
  .description('Execute a quick task (1-3 steps, no research)')
  .action(async (description: string[]) => {
    const { quickCommand } = await import('./commands/quick.js');
    await quickCommand(description.join(' '));
  });

program
  .command('progress')
  .description('Show current project status')
  .action(async () => {
    const { progressCommand } = await import('./commands/progress.js');
    await progressCommand();
  });

program
  .command('pause')
  .description('Save state for session resumption')
  .action(async () => {
    const { pauseCommand } = await import('./commands/pause.js');
    await pauseCommand();
  });

program
  .command('resume')
  .description('Restore state from last pause')
  .action(async () => {
    const { resumeCommand } = await import('./commands/resume.js');
    await resumeCommand();
  });

program
  .command('lesson <text...>')
  .description('Add a lesson learned')
  .action(async (text: string[]) => {
    const { lessonCommand } = await import('./commands/lesson.js');
    await lessonCommand(text.join(' '));
  });

program
  .command('shortcut <name> <value...>')
  .description('Add a shortcut/alias')
  .action(async (name: string, value: string[]) => {
    const { shortcutCommand } = await import('./commands/shortcut.js');
    await shortcutCommand(name, value.join(' '));
  });

program
  .command('install [target]')
  .description('Install chrisflex into AI CLI tools (claude, copilot, gemini, opencode, codex, droid, cursor)')
  .action(async (target?: string) => {
    const { installCommand } = await import('./commands/install.js');
    await installCommand(target);
  });

program.parse();
```

### .chrisflex/ Initialization
```typescript
// Source: Pattern from GSD init + fs-extra
import { ensureDir, writeJson, pathExists } from 'fs-extra';
import { writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { confirm } from '@clack/prompts';

export async function initChrisflex(projectDir: string): Promise<void> {
  const flexDir = join(projectDir, '.chrisflex');
  
  // Create directory structure
  await ensureDir(join(flexDir, 'logs'));
  await ensureDir(join(flexDir, 'screenshots'));
  await ensureDir(join(flexDir, 'phases'));
  await ensureDir(join(flexDir, 'quick'));
  
  // Create MEMORY.md (master index, must stay under 200 lines)
  await writeFile(join(flexDir, 'MEMORY.md'), MEMORY_TEMPLATE);
  
  // Create individual files
  await writeFile(join(flexDir, 'state.md'), STATE_TEMPLATE);
  await writeFile(join(flexDir, 'decisions.md'), DECISIONS_TEMPLATE);
  await writeFile(join(flexDir, 'lessons.md'), LESSONS_TEMPLATE);
  await writeFile(join(flexDir, 'shortcuts.md'), SHORTCUTS_TEMPLATE);
  await writeFile(join(flexDir, 'kanban.md'), KANBAN_TEMPLATE);
  await writeFile(join(flexDir, 'backlog.md'), BACKLOG_TEMPLATE);
  await writeFile(join(flexDir, 'conventions.md'), CONVENTIONS_TEMPLATE);
  await writeFile(join(flexDir, 'logs/INDEX.md'), LOG_INDEX_TEMPLATE);
  
  // Add to .gitignore
  await addToGitignore(projectDir, '.chrisflex/');
  
  // Ask user about git inclusion
  const includeInGit = await confirm({
    message: 'Include .chrisflex/ in git for team access?',
  });
  
  if (includeInGit) {
    await removeFromGitignore(projectDir, '.chrisflex/');
  }
}
```

### Context Monitor Hook
```javascript
#!/usr/bin/env node
// Source: Adapted from GSD's gsd-context-monitor.js (proven in production)
// PostToolUse hook — injects warning when context is running low

const fs = require('fs');
const os = require('os');
const path = require('path');

const WARNING_THRESHOLD = 35;   // remaining_percentage <= 35%
const CRITICAL_THRESHOLD = 25;  // remaining_percentage <= 25%
const STALE_SECONDS = 60;
const DEBOUNCE_CALLS = 5;

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const sessionId = data.session_id;
    if (!sessionId) process.exit(0);

    const metricsPath = path.join(os.tmpdir(), `chrisflex-ctx-${sessionId}.json`);
    if (!fs.existsSync(metricsPath)) process.exit(0);

    const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (metrics.timestamp && (now - metrics.timestamp) > STALE_SECONDS) process.exit(0);

    const remaining = metrics.remaining_percentage;
    const usedPct = metrics.used_pct;
    if (remaining > WARNING_THRESHOLD) process.exit(0);

    // Debounce logic (same as GSD)
    const warnPath = path.join(os.tmpdir(), `chrisflex-ctx-${sessionId}-warned.json`);
    let warnData = { callsSinceWarn: 0, lastLevel: null };
    let firstWarn = true;
    if (fs.existsSync(warnPath)) {
      try { warnData = JSON.parse(fs.readFileSync(warnPath, 'utf8')); firstWarn = false; } catch (e) {}
    }
    warnData.callsSinceWarn = (warnData.callsSinceWarn || 0) + 1;

    const isCritical = remaining <= CRITICAL_THRESHOLD;
    const currentLevel = isCritical ? 'critical' : 'warning';
    const severityEscalated = currentLevel === 'critical' && warnData.lastLevel === 'warning';
    if (!firstWarn && warnData.callsSinceWarn < DEBOUNCE_CALLS && !severityEscalated) {
      fs.writeFileSync(warnPath, JSON.stringify(warnData));
      process.exit(0);
    }

    warnData.callsSinceWarn = 0;
    warnData.lastLevel = currentLevel;
    fs.writeFileSync(warnPath, JSON.stringify(warnData));

    let message;
    if (isCritical) {
      message = `CHRISFLEX CONTEXT CRITICAL: Usage at ${usedPct}%. Remaining: ${remaining}%. ` +
        'STOP new work. Save state NOW. Run /chrisflex:pause to preserve session state.';
    } else {
      message = `CHRISFLEX CONTEXT WARNING: Usage at ${usedPct}%. Remaining: ${remaining}%. ` +
        'Wrap up current task. Run /chrisflex:pause if starting complex work.';
    }

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: message }
    }));
  } catch (e) {
    process.exit(0); // Silent fail — never block tool execution
  }
});
```

### Minute-Taker Entry
```typescript
// Source: Custom pattern for chrisflex
import dayjs from 'dayjs';
import { appendFile, stat, readFile } from 'node:fs/promises';
import { join } from 'node:path';

interface LogEntry {
  timestamp: Date;
  role: 'user' | 'assistant' | 'system';
  model?: string;
  runtime?: string; // 'claude-code' | 'copilot' | 'gemini' | 'opencode' | etc.
  content: string;
  agentActivity?: {
    filesRead?: string[];
    filesEdited?: string[];
    commands?: string[];
    mcpCalls?: string[];
  };
  gitCommits?: { hash: string; message: string }[];
}

export async function appendToLog(flexDir: string, entry: LogEntry): Promise<void> {
  const now = dayjs(entry.timestamp);
  const sessionFile = join(flexDir, 'logs', `session-${now.format('YYYY-MM-DD-HH-mm')}.md`);
  
  let line = `## ${now.format('HH:mm:ss')} — ${entry.role.toUpperCase()}`;
  if (entry.model) line += ` (${entry.model})`;
  if (entry.runtime) line += ` via ${entry.runtime}`;
  line += '\n\n';
  line += entry.content + '\n\n';
  
  if (entry.agentActivity) {
    line += '### Agent Activity\n';
    if (entry.agentActivity.filesRead?.length) {
      line += entry.agentActivity.filesRead.map(f => `- **Read:** ${f}`).join('\n') + '\n';
    }
    if (entry.agentActivity.filesEdited?.length) {
      line += entry.agentActivity.filesEdited.map(f => `- **Edit:** ${f}`).join('\n') + '\n';
    }
    if (entry.agentActivity.commands?.length) {
      line += entry.agentActivity.commands.map(c => `- **Run:** \`${c}\``).join('\n') + '\n';
    }
    line += '\n';
  }
  
  if (entry.gitCommits?.length) {
    line += '### Git\n';
    line += entry.gitCommits.map(c => `- Commit: \`${c.hash}\` — "${c.message}"`).join('\n') + '\n\n';
  }
  
  line += '---\n\n';
  
  await appendFile(sessionFile, line);
}
```

### Smart File Search
```typescript
// Source: Custom heuristic pattern for chrisflex
import { stat, readFile } from 'node:fs/promises';

interface SearchResult {
  file: string;
  lineNumber: number;
  content: string;
}

export async function smartSearch(
  filePath: string,
  keywords: string[],
  maxTokenBudget: number = 500
): Promise<SearchResult[]> {
  // Step 1: Check file size before reading
  const stats = await stat(filePath);
  const estimatedLines = Math.ceil(stats.size / 80); // rough estimate
  
  if (estimatedLines < 100) {
    // Small file: read entirely
    return fullSearch(filePath, keywords);
  }
  
  if (estimatedLines < 500) {
    // Medium file: read header + keyword search
    const content = await readFile(filePath, 'utf8');
    const lines = content.split('\n');
    return lines
      .map((line, i) => ({ file: filePath, lineNumber: i + 1, content: line }))
      .filter(({ content }) => keywords.some(k => content.toLowerCase().includes(k.toLowerCase())));
  }
  
  // Large file: read only the index/TOC section, then targeted reads
  // This is where cheap model delegation would happen in the full implementation
  const content = await readFile(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Read first 20 lines (usually contains TOC or headers)
  const header = lines.slice(0, 20);
  
  // Find matching sections by searching headers (## lines)
  const matchingHeaders = lines
    .map((line, i) => ({ line, index: i }))
    .filter(({ line }) => line.startsWith('#') && keywords.some(k => line.toLowerCase().includes(k.toLowerCase())));
  
  // Read 30 lines around each matching header
  const results: SearchResult[] = [];
  for (const { index } of matchingHeaders) {
    const start = Math.max(0, index - 5);
    const end = Math.min(lines.length, index + 25);
    for (let i = start; i < end; i++) {
      if (keywords.some(k => lines[i].toLowerCase().includes(k.toLowerCase()))) {
        results.push({ file: filePath, lineNumber: i + 1, content: lines[i] });
      }
    }
  }
  
  return results;
}
```

### Git Commit (No AI Attribution)
```typescript
// Source: simple-git + chrisflex convention
import simpleGit from 'simple-git';

export async function commitChanges(
  message: string,
  files: string[],
  options: { noCoAuthor: true } = { noCoAuthor: true }
): Promise<string> {
  const git = simpleGit();
  
  // Stage specific files
  await git.add(files);
  
  // Commit with clean message — NO co-authored-by, NO AI attribution
  // Override any global git hooks that might add AI attribution
  const result = await git.commit(message);
  
  return result.commit; // short hash
}
```

## Slash Commands Reference (Essential vs Advanced)

Based on analysis of GSD's 28 commands, here are the commands ChrisFlex should implement:

### ESSENTIAL (Phase 1 — implement now)
| Command | Description | GSD Equivalent |
|---------|-------------|----------------|
| `/chrisflex:init` | Initialize .chrisflex/ directory in project | `/gsd:new-project` (lighter) |
| `/chrisflex:quick [description]` | Execute a small task (1-3 steps, no research) | `/gsd:quick` |
| `/chrisflex:progress` | Show current project status, active task, recent history | `/gsd:progress` |
| `/chrisflex:pause` | Save state to .continue-here.md for session resumption | `/gsd:pause-work` |
| `/chrisflex:resume` | Restore state from last pause, reload context | `/gsd:resume-work` |
| `/chrisflex:help` | Show available commands | `/gsd:help` |
| `/chrisflex:lesson [text]` | Add to lessons learned file | New |
| `/chrisflex:shortcut [name] [value]` | Add to shortcuts file | New |
| `/chrisflex:settings` | View/edit configuration | `/gsd:settings` |

### ADVANCED (Phase 2 — implement later)
| Command | Description | GSD Equivalent |
|---------|-------------|----------------|
| `/chrisflex:new-project` | Full project setup with roadmap and phases | `/gsd:new-project` |
| `/chrisflex:plan-phase` | Plan a specific phase with tasks | `/gsd:plan-phase` |
| `/chrisflex:execute-phase` | Execute a planned phase | `/gsd:execute-phase` |
| `/chrisflex:map-codebase` | Map existing codebase (brownfield) | `/gsd:map-codebase` |
| `/chrisflex:verify` | Verify phase/task completion | `/gsd:verify-work` |
| `/chrisflex:debug` | Structured debugging session | `/gsd:debug` |
| `/chrisflex:add-todo` | Capture idea for later | `/gsd:add-todo` |
| `/chrisflex:check-todos` | Review pending todos | `/gsd:check-todos` |
| `/chrisflex:screenshot` | Take browser screenshot for UI iteration | New |
| `/chrisflex:cleanup` | Archive completed phases | `/gsd:cleanup` |
| `/chrisflex:install` | Install into AI CLI tools | GSD's npx installer |
| `/chrisflex:discuss` | Discuss phase approach before planning | `/gsd:discuss-phase` |
| `/chrisflex:transition` | Hand off work between sessions/tools | New (cli-continues-inspired) |

### NOT NEEDED (GSD commands to skip)
| GSD Command | Why Skip |
|-------------|----------|
| `/gsd:new-milestone` | Overkill for most projects |
| `/gsd:complete-milestone` | Overkill for most projects |
| `/gsd:audit-milestone` | Overkill for most projects |
| `/gsd:plan-milestone-gaps` | Overkill for most projects |
| `/gsd:insert-phase` | Rarely used |
| `/gsd:remove-phase` | Rarely used |
| `/gsd:add-phase` | Can be done manually |
| `/gsd:set-profile` | ChrisFlex has simpler config |
| `/gsd:update` | npm update handles this |
| `/gsd:join-discord` | Not applicable |
| `/gsd:add-tests` | Can be a quick task |
| `/gsd:diagnose-issues` | Can use debug instead |
| `/gsd:research-phase` | Integrated into plan-phase |
| `/gsd:list-phase-assumptions` | Overkill |

## Model Routing Strategy

### Cost Tiers
| Tier | Models | Cost | Use For |
|------|--------|------|---------|
| **Free** | GPT-4.1, GPT-5 mini, Claude Haiku 4.5 (via GitHub Copilot Free) | $0 | Research, scouting, searching, log management, commit messages, summarization, policing |
| **Budget** | Claude Haiku 4.5, Gemini 3 Flash, GPT-5.1-Codex-Mini (0.25-0.33x) | Low | Planning quick tasks, file searches, code review |
| **Standard** | Claude Sonnet 4-4.6, GPT-5.1 (1x) | Medium | Implementation, complex edits, multi-file changes |
| **Premium** | Claude Opus 4.5-4.6, GPT-5.2 (1-3x) | High | Architecture decisions, complex debugging, full project planning |

### Routing Rules
- **Minute-taker logging:** Free tier (just append text to file, no intelligence needed)
- **Commit message generation:** Free tier
- **File searching / smart search:** Free tier → summarize → pass to expensive model
- **Quick task planning (1-3 tasks):** Budget tier
- **Quick task execution:** Standard tier
- **Full project planning:** Standard tier
- **Complex implementation:** Standard or Premium tier
- **Debugging hard problems:** Premium tier
- **Research agents (parallel):** Free tier (up to 4 agents)
- **Context monitor / state saving:** No model needed (hook logic only)

## Session Reading (Multi-CLI Support)

### Supported CLI Tools and Session Locations
| CLI Tool | Session Location | Format | Parser Complexity |
|----------|-----------------|--------|-------------------|
| Claude Code | `~/.claude/projects/{hash}/*.jsonl` | JSONL | Medium |
| Codex | `~/.codex/sessions/{date}/rollout-*.jsonl` | JSONL | Medium |
| GitHub Copilot | `~/.copilot/session-state/{uuid}/` | YAML + JSONL | Medium |
| Gemini CLI | `~/.gemini/tmp/*/chats/session-*.json` | JSON | Medium |
| OpenCode | `~/.local/share/opencode/storage/` | JSON or SQLite | High |
| Factory Droid | `~/.factory/sessions/` | JSONL + JSON | Medium |
| Cursor Agent | `~/.cursor/projects/*/agent-transcripts/*.jsonl` | JSONL | Low |

**Implementation strategy:** Study and adapt patterns from `cli-continues` (npm: `continues`). Their parser architecture at `src/parsers/` is well-designed with one file per CLI tool, Zod schema validation, and a unified session format. ChrisFlex can either depend on `continues` as a library (it exports a programmatic API) or adapt its parser patterns.

## Browser Screenshot Integration

### Recommended: Playwright MCP
**Package:** `@playwright/mcp` v0.0.68+ (1.2M+ weekly downloads, Microsoft-maintained)
**Launch:** `npx @playwright/mcp@latest --headless --caps=vision --viewport-size=1280x720`

### Settings for Screenshot Iteration
| Setting | Value | Rationale |
|---------|-------|-----------|
| Viewport | 1280x720 | Standard HD, good for most web layouts |
| Format | JPEG, quality 80 | 3-5x smaller than PNG, fine for iteration |
| Max dimension | 2000px | Matches vision model input limits |
| Full page | No (viewport only) | Full-page screenshots are too large |
| Device pixel ratio | 1 | Avoids HiDPI bloat |

### Permission Flow
1. First screenshot request → ask user: "ChrisFlex wants to take a screenshot of http://localhost:3000. Allow? [y/n]"
2. Subsequent screenshots in same session → auto-approve (user already consented)
3. Config flag: `{ "screenshots": { "autoApprove": false } }` for persistent preference
4. Never screenshot arbitrary URLs — only the user's own dev server

### Also Available
- **Chrome DevTools MCP** (`chrome-devtools-mcp` v0.17.3, 364K weekly) — better for performance profiling and network inspection
- **Playwright CLI** (`@playwright/cli` v0.1.1) — shell-command-based, more token-efficient than MCP protocol
- **Deprecated:** `@modelcontextprotocol/server-puppeteer` — do not use

## Coding Principles (Baked Into Tool)

These principles should be written into MEMORY.md templates and enforced by chrisflex:

1. **"Prioritize simplicity and readability over cleverness."**
2. **"Strictly adhere to DRY (Don't Repeat Yourself) principles."**
3. **"Avoid premature optimization by following YAGNI (You Aren't Gonna Need It) principles."**
4. **Anti-overkill:** If a task takes < 10 lines of code, skip research. Just do it.
5. **Context gate:** Do not search the whole codebase unless explicitly asked.
6. **File-based memory:** Write to disk, never rely on context alone.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| One big CLAUDE.md | Multiple small focused files | 2025+ | Survives 200-line limit |
| Rely on compaction | Pre-compaction state saves | GSD 2025 | No more lossy summarization |
| Single long session | Fresh sub-agents per task | GSD 2025 | Prevents context rot |
| Puppeteer MCP | Playwright MCP | 2025 | Better maintained, more features |
| Manual commit messages | Free model generates commits | 2025+ | Saves premium model tokens |
| yargs for CLI | Commander.js v14 | 2025+ | Zero deps, simpler subcommands |

**Deprecated/outdated:**
- `@modelcontextprotocol/server-puppeteer`: Deprecated on npm, replaced by Playwright MCP
- Single-file memory (one huge MEMORY.md): Doesn't survive Claude Code's 200-line limit
- CJS modules for new CLI tools: ESM is the standard since Node.js 20+

## Open Questions

1. **Gemini CLI protobuf sessions:** On this machine, Gemini stores sessions as `.pb` (protobuf) files in `~/.gemini/antigravity/conversations/`, NOT the JSON format that cli-continues expects. Need to investigate whether newer Gemini CLI versions use JSON, or if a protobuf parser is needed.
   - What we know: cli-continues looks for `~/.gemini/tmp/*/chats/session-*.json`
   - What's unclear: Whether both formats coexist or if protobuf replaced JSON
   - Recommendation: Support JSON format first, add protobuf later if needed

2. **Cost-tier model routing implementation:** How does chrisflex actually route to different models? It would need API keys for each provider, or integration with the CLI tools that already have auth.
   - What we know: GitHub Copilot Free provides GPT-4.1, GPT-5 mini, Claude Haiku 4.5 at zero cost
   - What's unclear: How to programmatically use these models from chrisflex (API vs CLI tool delegation)
   - Recommendation: Start by delegating to CLI tools (spawn Claude Code, Copilot, etc.) rather than calling APIs directly. API integration can come later.

3. **Minute-taker implementation:** How does chrisflex capture the conversation in real-time? Options:
   - Claude Code hooks (PostToolUse) — can capture tool usage but not conversation
   - Session file monitoring (watch Claude's JSONL files) — can capture everything
   - Manual logging (chrisflex is the conversation layer) — only works if chrisflex mediates all interaction
   - Recommendation: Use session file monitoring for passive capture, hooks for active state management

## Sources

### Primary (HIGH confidence)
- npm registry — verified all package versions, weekly downloads, deprecation status (2026-02-24)
- GSD codebase at `/home/chris/get-shit-done/` — read hooks, workflows, agents, templates
- cli-continues codebase — analyzed all 7 parsers, schemas, handoff generator
- Claude Code session files at `~/.claude/` — verified actual file formats on this machine
- OpenCode storage at `~/.local/share/opencode/` — verified actual file formats on this machine
- Copilot session files at `~/.copilot/` — verified actual file formats on this machine
- Gemini storage at `~/.gemini/` — verified actual file formats on this machine

### Secondary (MEDIUM confidence)
- Playwright MCP npm page and README — current version and tool inventory
- Chrome DevTools MCP npm page — current version and tool inventory
- Commander.js v14 documentation
- tsup v8 documentation

### Tertiary (LOW confidence)
- Gemini CLI JSON session format — from cli-continues schemas, not verified on this machine (protobuf found instead)
- Factory Droid and Cursor session formats — from cli-continues schemas, not installed on this machine
- Model pricing tiers — based on training data, may have changed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified all packages on npm, cross-referenced with real-world usage
- Architecture: HIGH — based on proven GSD patterns + cli-continues analysis + direct file system verification
- Pitfalls: HIGH — based on documented issues in GSD docs, Claude Code behavior, and Gemini conversation
- Browser tools: HIGH — verified Playwright MCP and Chrome DevTools MCP on npm
- Session formats: MEDIUM — verified 4/7 on this machine, 3/7 from cli-continues schemas only
- Model routing: MEDIUM — pricing/availability may change, GitHub Copilot free tier confirmed

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (30 days — stable domain, libraries unlikely to change dramatically)
