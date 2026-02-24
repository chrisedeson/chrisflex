<purpose>
Add a lesson learned to the project's memory. Things learned the hard way — the "burned stove" list.
</purpose>

<process>
<step name="add">
Run:
```bash
chrisflex lesson "your lesson here"
```

With category:
```bash
chrisflex lesson -c git "Always squash PRs before merging"
chrisflex lesson -c perf "Lazy load heavy components"
chrisflex lesson -c security "Never log tokens to console"
```

Categories are free-form. Common ones: general, git, perf, security, testing, deployment, debugging.
</step>

<step name="verify">
The lesson is added to .chrisflex/lessons.md as a table row.
MEMORY.md is automatically synced with the top 10 lessons inline.
</step>
</process>

<success_criteria>
- [ ] Lesson added to lessons.md
- [ ] MEMORY.md synced
- [ ] Lesson visible in `chrisflex progress`
</success_criteria>
