// chrisflex — Programmatic API exports
// Use these when integrating chrisflex into other tools or scripts

// Types
export type {
  ChrisflexConfig,
  TaskScale,
  LogEntry,
  SessionIndex,
  KanbanItem,
  Lesson,
  Shortcut,
  ContinueHere,
} from './types.js';

export { CHRISFLEX_DIR, MEMORY_MAX_LINES, CODING_PRINCIPLES } from './types.js';

// Memory management
export {
  findFlexDir,
  getFlexDir,
  getProjectRoot,
  initializeFlexDir,
  addToGitignore,
  removeFromGitignore,
  readFlexFile,
  syncMemoryIndex,
} from './lib/memory.js';

// Smart search
export {
  inspectFile,
  smartSearch,
  readLineRange,
} from './lib/smart-search.js';
export type { SearchResult, FileInfo } from './lib/smart-search.js';

// Git operations
export {
  commitChanges,
  getCurrentBranch,
  getShortHash,
  isGitRepo,
  getRecentCommits,
  getModifiedFiles,
} from './lib/git.js';

// Minute-taker
export {
  getSessionLogPath,
  startSession,
  appendLogEntry,
  updateLogIndex,
} from './lib/minute-taker.js';

// Templates
export {
  memoryTemplate,
  stateTemplate,
  lessonsTemplate,
  shortcutsTemplate,
  kanbanTemplate,
  backlogTemplate,
  milestonesTemplate,
  conventionsTemplate,
  decisionsTemplate,
  logIndexTemplate,
  configTemplate,
} from './lib/templates.js';

// Logger
export * as logger from './lib/logger.js';
