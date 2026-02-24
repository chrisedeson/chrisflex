<purpose>
Display the complete ChrisFlex command reference. Output ONLY the reference content.
</purpose>

<reference>
# ChrisFlex Command Reference

**ChrisFlex** is a lean AI coding workflow manager with persistent memory. It solves context compaction, 200-line doc limits, and token waste.

## Quick Start

1. `chrisflex init` - Initialize .chrisflex/ in your project
2. `chrisflex lesson "your lesson"` - Add a lesson learned
3. `chrisflex progress` - Check project status

## Commands

### Project Setup

**`chrisflex init`**
Initialize .chrisflex/ directory with all memory files.
Creates: MEMORY.md, state.md, lessons.md, shortcuts.md, kanban.md, conventions.md, decisions.md, logs/, config.json

**`chrisflex progress`** (alias: `status`, `p`)
Show project status — git info, memory stats, lessons/shortcuts counts, recent commits.

### Memory Management

**`chrisflex lesson "text"`** (alias: `-c category`)
Add a lesson learned to lessons.md. Syncs MEMORY.md index.
Example: `chrisflex lesson -c git "Always squash PRs"`

**`chrisflex shortcut <name> <value>`** (alias: `-d description`)
Add a shortcut or alias to shortcuts.md. Syncs MEMORY.md index.
Example: `chrisflex shortcut deploy "npm run build && npm publish" -d "Build and publish"`

### Session Management

**`chrisflex pause`** (alias: `save`, `-m message`)
Save current state to .continue-here.md for session resumption.
Captures: status, active task, branch, unsaved changes, in-progress tasks.
Example: `chrisflex pause -m "fixing auth bug on login page"`

**`chrisflex resume`**
Show last saved state from .continue-here.md. Restores status to Active.

### Quick Tasks

**`chrisflex quick "description"`** (alias: `q`, `-s status`)
Log a micro task with no ceremony. Anti-overkill.
- Default status: `done` (just log what you did)
- Todo: `chrisflex quick -s todo "add unit tests"`
- Logged to `.chrisflex/quick/YYYY-MM-DD.md`

### Configuration

**`chrisflex settings`** (alias: `config`)
View all settings. Set with dot notation:
Example: `chrisflex settings -s git.autoBranch=true`

### Help

**`chrisflex help-examples`**
Show usage examples for all commands.

## Key Principles

1. **Anti-overkill** — Small tasks should be fast. Don't over-research.
2. **MEMORY.md stays under 200 lines** — It's an index pointing to separate files.
3. **No AI co-author** — Never add "Co-authored-by: Claude" to commits.
4. **File-based memory** — Write to disk, never rely on context alone.
5. **Smart search** — Check file size before reading to save tokens.

## .chrisflex/ Directory Structure

```
.chrisflex/
├── MEMORY.md          # Master index (MUST stay under 200 lines)
├── config.json        # Settings
├── state.md           # Current status
├── lessons.md         # Lessons learned (burned stove list)
├── shortcuts.md       # SSH aliases, custom commands
├── kanban.md          # Task board
├── backlog.md         # Future ideas, deferred features
├── milestones.md      # Milestone tracking
├── conventions.md     # Coding standards, naming, git rules
├── decisions.md       # Decision log with rationale
├── .continue-here.md  # Session resumption state (from pause)
├── logs/              # Session logs (minute-taker)
│   └── INDEX.md       # Log index
├── quick/             # Quick task logs by date
├── screenshots/       # Captured screenshots
└── phases/            # Phase-specific artifacts
```
</reference>

<success_criteria>
- [ ] User sees the full command reference
- [ ] No extra commentary added
</success_criteria>
