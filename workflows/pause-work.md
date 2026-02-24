<purpose>
Save current work state for session resumption. Creates .continue-here.md with full context so a fresh session can pick up exactly where you left off.

This is the COMPACTION SURVIVAL mechanism. Use before context runs out, before ending a session, or when switching tasks.
</purpose>

<process>
<step name="gather">
Collect current state:
1. Read .chrisflex/state.md for current status
2. Check git branch, last commit hash, modified files
3. Read .chrisflex/kanban.md for in-progress tasks
4. Ask user for a note about what they were doing (optional)
</step>

<step name="save">
Run:
```bash
chrisflex pause -m "your note here"
```

Or if chrisflex CLI is not available, create .chrisflex/.continue-here.md manually with:
- When you left off (note + status)
- Git state (branch, commit, unsaved changes)
- In-progress tasks
- Quick context about next steps
</step>

<step name="warn">
If there are unsaved changes (staged, modified, or untracked files), warn the user:
"You have N unsaved file(s). Consider committing before closing."
</step>

<step name="confirm">
Display confirmation:
- State saved to .continue-here.md
- Branch and commit info
- How to resume: `chrisflex resume`
</step>
</process>

<success_criteria>
- [ ] .continue-here.md created in .chrisflex/
- [ ] Current state captured (status, git, tasks)
- [ ] User warned about unsaved changes
- [ ] User knows how to resume
</success_criteria>
