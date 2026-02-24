<purpose>
Add a shortcut or alias to the project's memory. SSH aliases, deployment commands, frequently used paths.
</purpose>

<process>
<step name="add">
Run:
```bash
chrisflex shortcut <name> <value> -d "description"
```

Examples:
```bash
chrisflex shortcut deploy "npm run build && npm publish" -d "Build and publish to npm"
chrisflex shortcut ssh-prod "ssh user@prod.example.com" -d "SSH into production"
chrisflex shortcut test "npm run test -- --coverage" -d "Run tests with coverage"
```

If a shortcut with the same name exists, it will be updated.
</step>

<step name="verify">
The shortcut is added to .chrisflex/shortcuts.md as a table row.
MEMORY.md is automatically synced with the top 5 shortcuts inline.
</step>
</process>

<success_criteria>
- [ ] Shortcut added to shortcuts.md
- [ ] MEMORY.md synced
- [ ] Shortcut visible in `chrisflex progress`
</success_criteria>
