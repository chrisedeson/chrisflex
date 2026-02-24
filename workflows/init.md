<purpose>
Initialize ChrisFlex in the current project. Creates .chrisflex/ directory with all memory files. Equivalent to running `chrisflex init`.
</purpose>

<process>
<step name="check">
Check if .chrisflex/ already exists in the current directory.
If it does, ask the user if they want to reinitialize (existing files won't be deleted).
</step>

<step name="init">
Run `chrisflex init` and follow the interactive prompts:
1. Enter project name (defaults to directory name)
2. Choose whether to include .chrisflex/ in git for team access

If chrisflex CLI is not available, create the directory manually:
```bash
mkdir -p .chrisflex/{logs,screenshots,phases,quick}
```
Then create the template files from the chrisflex library.
</step>

<step name="confirm">
Verify .chrisflex/ was created with all expected files:
- MEMORY.md, state.md, lessons.md, shortcuts.md
- kanban.md, backlog.md, milestones.md
- conventions.md, decisions.md, config.json
- logs/INDEX.md
</step>
</process>

<success_criteria>
- [ ] .chrisflex/ directory created
- [ ] All template files present
- [ ] .gitignore updated (if in git repo)
- [ ] User informed of next steps
</success_criteria>
