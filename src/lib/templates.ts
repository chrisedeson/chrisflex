// Template content for .chrisflex/ files
// Each template is designed to stay well under 200 lines

import dayjs from 'dayjs';

export function memoryTemplate(projectName: string, projectDir: string): string {
  const now = dayjs().format('YYYY-MM-DD HH:mm');
  return `# ${projectName} — ChrisFlex Memory

> Master index file. MUST stay under 200 lines. Everything else lives in separate files.
> Last updated: ${now}

## Project
- **Name:** ${projectName}
- **Directory:** ${projectDir}
- **Initialized:** ${now}

## Status → [state.md](./state.md)

## Pointers
- Lessons learned → [lessons.md](./lessons.md)
- Shortcuts & aliases → [shortcuts.md](./shortcuts.md)
- Conventions & rules → [conventions.md](./conventions.md)
- Kanban board → [kanban.md](./kanban.md)
- Backlog → [backlog.md](./backlog.md)
- Milestones → [milestones.md](./milestones.md)
- Session logs → [logs/INDEX.md](./logs/INDEX.md)
- Decisions → [decisions.md](./decisions.md)

## Top Lessons (inline for quick access)
_None yet. Use \`chrisflex lesson "your lesson"\` to add._

## Top Shortcuts (inline for quick access)
_None yet. Use \`chrisflex shortcut name "value"\` to add._

## Coding Principles
1. Prioritize simplicity and readability over cleverness.
2. Strictly adhere to DRY (Don't Repeat Yourself) principles.
3. Avoid premature optimization by following YAGNI (You Aren't Gonna Need It) principles.

## Current Task
_No active task._
`;
}

export function stateTemplate(): string {
  const now = dayjs().format('YYYY-MM-DD HH:mm');
  return `# Current State

**Last updated:** ${now}
**Status:** Idle
**Active task:** None

## Recent Activity
_No activity yet._

## Current Context
_No active context._
`;
}

export function lessonsTemplate(): string {
  return `# Lessons Learned

> Things learned the hard way. The "burned stove" list.
> Use \`chrisflex lesson "your lesson"\` to add entries.

| # | Date | Category | Lesson |
|---|------|----------|--------|
`;
}

export function shortcutsTemplate(): string {
  return `# Shortcuts & Aliases

> Project-specific shortcuts, SSH aliases, custom commands.
> Use \`chrisflex shortcut name "value"\` to add entries.

| Name | Value | Description | Added |
|------|-------|-------------|-------|
`;
}

export function kanbanTemplate(): string {
  return `# Kanban Board

## 🔴 Blocked
_None_

## 🟡 In Progress
_None_

## 📋 Todo
_None_

## ✅ Done
_None_
`;
}

export function backlogTemplate(): string {
  return `# Backlog

> Future ideas, deferred features, things to revisit.

## Ideas
_None yet._

## Deferred
_None yet._
`;
}

export function milestonesTemplate(): string {
  return `# Milestones

| # | Name | Target Date | Status | Notes |
|---|------|-------------|--------|-------|
`;
}

export function conventionsTemplate(): string {
  return `# Conventions & Rules

## Coding Standards
1. Prioritize simplicity and readability over cleverness.
2. Strictly adhere to DRY (Don't Repeat Yourself) principles.
3. Avoid premature optimization by following YAGNI (You Aren't Gonna Need It) principles.

## Naming Patterns
_Define your naming conventions here._

## Git Rules
- NO co-authored-by or AI attribution in commits
- Simple commit messages
- Test before merging to main/staging

## Project-Specific Rules
_Add project-specific rules here._
`;
}

export function decisionsTemplate(): string {
  return `# Decisions Log

> Key decisions made and their rationale.

| # | Date | Decision | Rationale |
|---|------|----------|-----------|
`;
}

export function logIndexTemplate(): string {
  return `# Session Log Index

> Quick lookup for past sessions. Newest first.

| Date | Model | Duration | Tasks | Files Modified | Log |
|------|-------|----------|-------|----------------|-----|
`;
}

export function configTemplate(projectName: string, projectDir: string): string {
  return JSON.stringify(
    {
      version: '0.1.0',
      initialized: new Date().toISOString(),
      project: {
        name: projectName,
        description: '',
        directory: projectDir,
      },
      git: {
        noCoAuthor: true,
        commitModel: 'free',
        autoBranch: false,
      },
      screenshots: {
        autoApprove: false,
        viewport: '1280x720',
        format: 'jpeg',
        quality: 80,
      },
      scaling: {
        defaultMode: 'auto',
      },
    },
    null,
    2
  );
}
