// chrisflex CLI — Main entry point
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { progressCommand } from './commands/progress.js';
import { lessonCommand } from './commands/lesson.js';
import { shortcutCommand } from './commands/shortcut.js';
import { pauseCommand } from './commands/pause.js';
import { resumeCommand } from './commands/resume.js';
import { quickCommand } from './commands/quick.js';
import { settingsCommand } from './commands/settings.js';
import { installCommand } from './commands/install.js';
import { showBanner } from './lib/banner.js';
import * as log from './lib/logger.js';

const program = new Command();

program
  .name('chrisflex')
  .description('Lean AI coding workflow manager with persistent memory')
  .version('0.1.1');

// Init — create .chrisflex/ in current project
program
  .command('init')
  .description('Initialize .chrisflex/ directory with memory files')
  .action(async () => {
    try {
      await initCommand();
    } catch (err) {
      log.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// Progress — show project status
program
  .command('progress')
  .aliases(['status', 'p'])
  .description('Show project status, git info, memory stats')
  .action(async () => {
    try {
      await progressCommand();
    } catch (err) {
      log.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// Lesson — add a lesson learned
program
  .command('lesson <text>')
  .description('Add a lesson learned to lessons.md')
  .option('-c, --category <category>', 'Lesson category', 'general')
  .action(async (text: string, opts: { category: string }) => {
    try {
      await lessonCommand(text, opts.category);
    } catch (err) {
      log.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// Shortcut — add a shortcut/alias
program
  .command('shortcut <name> <value>')
  .description('Add a shortcut or alias to shortcuts.md')
  .option('-d, --description <desc>', 'Shortcut description', '')
  .action(async (name: string, value: string, opts: { description: string }) => {
    try {
      await shortcutCommand(name, value, opts.description);
    } catch (err) {
      log.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// Pause — save current state for session resumption
program
  .command('pause')
  .aliases(['save'])
  .description('Save current state to .continue-here.md for session resumption')
  .option('-m, --message <message>', 'Quick note about what you were doing')
  .action(async (opts: { message?: string }) => {
    try {
      await pauseCommand(opts.message);
    } catch (err) {
      log.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// Resume — restore state from last pause
program
  .command('resume')
  .description('Show last saved state from .continue-here.md')
  .action(async () => {
    try {
      await resumeCommand();
    } catch (err) {
      log.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// Quick — execute small tasks without overhead
program
  .command('quick <description>')
  .aliases(['q'])
  .description('Log a quick task (anti-overkill — no research, just do it)')
  .option('-s, --status <status>', 'Task status: todo, done', 'done')
  .action(async (description: string, opts: { status: string }) => {
    try {
      await quickCommand(description, opts.status as 'todo' | 'done');
    } catch (err) {
      log.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// Settings — view/edit config
program
  .command('settings')
  .aliases(['config'])
  .description('View or edit chrisflex configuration')
  .option('-s, --set <key=value>', 'Set a config value (dot notation)')
  .action(async (opts: { set?: string }) => {
    try {
      await settingsCommand(opts.set);
    } catch (err) {
      log.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// Help — enhanced with examples
program
  .command('help-examples')
  .description('Show usage examples')
  .action(() => {
    log.banner('EXAMPLES');
    console.log(`
  ${'\x1b[1m'}Getting Started${'\x1b[0m'}
    chrisflex init                         Initialize in current project
    chrisflex progress                     Check project status

  ${'\x1b[1m'}Memory Management${'\x1b[0m'}
    chrisflex lesson "Always test first"   Add a lesson learned
    chrisflex lesson -c git "Squash PRs"   Add categorized lesson
    chrisflex shortcut deploy "npm run deploy"  Save a shortcut

  ${'\x1b[1m'}Session Management${'\x1b[0m'}
    chrisflex pause -m "fixing auth bug"   Save state before stopping
    chrisflex resume                       See where you left off

  ${'\x1b[1m'}Quick Tasks${'\x1b[0m'}
    chrisflex quick "fixed typo in readme" Log a micro task (done)
    chrisflex quick -s todo "add tests"    Log a todo item

  ${'\x1b[1m'}Configuration${'\x1b[0m'}
    chrisflex settings                     View all settings
    chrisflex settings -s git.autoBranch=true  Update a setting

  ${'\x1b[1m'}Installation${'\x1b[0m'}
    chrisflex install                      Install to all detected CLI tools
    chrisflex install claude               Install to Claude Code only
`);
  });

// Install — install slash commands and hooks to CLI tools
program
  .command('install [target]')
  .description('Install slash commands and hooks into CLI tools (claude, copilot, gemini, etc.)')
  .action(async (target?: string) => {
    try {
      await installCommand(target);
    } catch (err) {
      log.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// Show animated banner when no command is given (just `chrisflex`)
// Commander sets args to the command args — if no command, argv length is 2 (node + script)
const args = process.argv.slice(2);
if (args.length === 0 || args[0] === '--banner') {
  showBanner().then(() => {
    if (args[0] !== '--banner') {
      program.outputHelp();
    }
  });
} else {
  program.parse();
}
