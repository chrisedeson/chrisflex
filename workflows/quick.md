<purpose>
Execute a quick task with zero overhead. Anti-overkill: no research, no planning ceremony, just do the thing and log it.

Use for tasks that are < 10 lines of code or simple edits. If a task needs more than 3 steps, it's not a quick task.
</purpose>

<process>
<step name="assess">
Before starting, quickly assess task scale:
- **Micro** (< 10 lines, 1 file): Just do it, log with `chrisflex quick`
- **Quick** (10-50 lines, 1-3 files): Do it, log it, maybe a brief note
- **Full** (50+ lines, many files): This isn't a quick task. Suggest proper planning.

If the task is micro/quick, proceed. Otherwise, tell the user.
</step>

<step name="execute">
1. Do the work directly — no research phase, no planning docs
2. Keep changes minimal and focused
3. Test if applicable (run existing tests, quick manual check)
</step>

<step name="log">
Log what was done:
```bash
chrisflex quick "description of what was done"
```

Or for a todo:
```bash
chrisflex quick -s todo "description of what needs doing"
```
</step>

<step name="commit">
If code was changed, commit with a simple message:
```bash
git add -A && git commit -m "fix: brief description"
```
No ceremony. No AI co-author. Simple.
</step>
</process>

<success_criteria>
- [ ] Task completed in minimal steps
- [ ] Logged to .chrisflex/quick/
- [ ] Changes committed (if applicable)
- [ ] No over-engineering or unnecessary research
</success_criteria>
