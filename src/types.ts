// Shared types for chrisflex

export interface ChrisflexConfig {
  version: string;
  initialized: string; // ISO timestamp
  project: {
    name: string;
    description: string;
    directory: string;
  };
  git: {
    noCoAuthor: boolean;
    commitModel: 'free' | 'budget';
    autoBranch: boolean;
  };
  screenshots: {
    autoApprove: boolean;
    viewport: string;
    format: 'jpeg' | 'png';
    quality: number;
  };
  scaling: {
    defaultMode: 'auto' | 'micro' | 'quick' | 'full' | 'project';
  };
}

export type TaskScale = 'micro' | 'quick' | 'full' | 'project';

export interface LogEntry {
  timestamp: string; // ISO
  role: 'user' | 'assistant' | 'system';
  model?: string;
  runtime?: string;
  content: string;
  agentActivity?: {
    filesRead?: string[];
    filesEdited?: string[];
    commands?: string[];
    mcpCalls?: string[];
  };
  gitCommits?: { hash: string; message: string }[];
}

export interface SessionIndex {
  date: string;
  model: string;
  duration: string;
  tasks: number;
  filesModified: number;
  logFile: string;
}

export interface KanbanItem {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
  created: string;
  updated: string;
  priority: 'high' | 'medium' | 'low';
  description?: string;
}

export interface Lesson {
  id: string;
  date: string;
  category: string;
  content: string;
}

export interface Shortcut {
  name: string;
  value: string;
  description: string;
  added: string;
}

export interface ContinueHere {
  phase?: string;
  task?: string;
  totalTasks?: number;
  status: string;
  lastUpdated: string;
  currentState: string;
  completedWork: string[];
  remainingWork: string[];
  decisionsMade: string[];
  blockers: string[];
  context: string;
  nextAction: string;
}

export const CHRISFLEX_DIR = '.chrisflex';
export const MEMORY_MAX_LINES = 190; // Safety margin under 200

export const CODING_PRINCIPLES = [
  'Prioritize simplicity and readability over cleverness.',
  'Strictly adhere to DRY (Don\'t Repeat Yourself) principles.',
  'Avoid premature optimization by following YAGNI (You Aren\'t Gonna Need It) principles.',
] as const;
