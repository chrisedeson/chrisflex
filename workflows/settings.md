<purpose>
View or edit ChrisFlex configuration. Equivalent to running `chrisflex settings`.
</purpose>

<process>
<step name="view">
To view all settings:
```bash
chrisflex settings
```

Shows: project info, git settings, screenshot settings, scaling mode.
</step>

<step name="set">
To change a setting:
```bash
chrisflex settings -s section.key=value
```

Examples:
```bash
chrisflex settings -s git.autoBranch=true
chrisflex settings -s screenshots.quality=90
chrisflex settings -s scaling.defaultMode=quick
chrisflex settings -s git.commitModel=budget
```

Available sections and keys:
- **project**: name, description, directory
- **git**: noCoAuthor (bool), commitModel (free/budget), autoBranch (bool)
- **screenshots**: autoApprove (bool), viewport (string), format (jpeg/png), quality (number)
- **scaling**: defaultMode (auto/micro/quick/full/project)
</step>
</process>

<success_criteria>
- [ ] Settings displayed or updated
- [ ] Previous value shown when updating
</success_criteria>
