<purpose>
Resume work from a previous session. Reads .continue-here.md and restores context so you can pick up where you left off.
</purpose>

<process>
<step name="load">
Run:
```bash
chrisflex resume
```

This reads .chrisflex/.continue-here.md and displays:
- What you were doing when you paused
- Your note (if any)
- Git state at pause time
- Unsaved changes at pause time
- In-progress tasks

Also shows CURRENT state for comparison.
</step>

<step name="orient">
After reading the saved state:
1. Check if git branch matches what was saved
2. Check if there are new commits since the pause
3. Read .chrisflex/state.md for any updates
4. Orient yourself: what was the plan, what's next?
</step>

<step name="proceed">
Pick up from the next action noted in .continue-here.md.
The saved state should tell you exactly what to do first.
</step>
</process>

<success_criteria>
- [ ] .continue-here.md read and displayed
- [ ] Current state compared with saved state
- [ ] Status updated to Active
- [ ] Ready to continue work
</success_criteria>
