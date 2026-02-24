<purpose>
Show current project status. Equivalent to running `chrisflex progress`.
Displays: project info, current state, git status, memory stats.
</purpose>

<process>
<step name="show">
Run `chrisflex progress` to display:
- Project name, directory, initialization date
- Current status and active task
- Git branch, staged/modified/untracked counts
- Recent commits
- Lessons and shortcuts counts
- MEMORY.md line count (should be under 200)

If chrisflex CLI is not available, read the files directly:
```bash
cat .chrisflex/state.md
cat .chrisflex/config.json
git status --short
git log --oneline -5
```
</step>
</process>

<success_criteria>
- [ ] Project status displayed
- [ ] Git info shown
- [ ] Memory stats shown
</success_criteria>
