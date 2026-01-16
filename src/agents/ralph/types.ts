/**
 * RALPH - Relentless Autonomous Launch & Progress Handler
 * Type definitions for the autonomous feature shipping agent
 */

export interface RalphPRD {
  id: string;
  title: string;
  description: string;
  goal: string;
  successCriteria: string[];
  outOfScope: string[];
  technicalNotes: string[];
  createdAt: string;
  status: 'draft' | 'approved' | 'in_progress' | 'completed' | 'blocked';
}

export interface RalphTask {
  id: string;
  prdId: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  filesToModify: string[];
  filesToCreate: string[];
  complexity: 'tiny' | 'small' | 'medium' | 'large';
  order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
  commits: string[];
  notes: string[];
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface RalphProgress {
  currentPrd: RalphPRD | null;
  tasks: RalphTask[];
  currentTaskIndex: number;
  startedAt: string;
  lastUpdated: string;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  isRunning: boolean;
}

export interface RalphMemory {
  completedPrds: {
    id: string;
    title: string;
    completedAt: string;
    tasksCompleted: number;
    commits: string[];
  }[];
  learnings: {
    date: string;
    lesson: string;
    context: string;
  }[];
  blockers: {
    id: string;
    description: string;
    since: string;
    resolved: boolean;
  }[];
}

export interface RalphConfig {
  maxTasksPerRun: number;
  autoCommit: boolean;
  runTests: boolean;
  notifyOnComplete: boolean;
  pauseOnFail: boolean;
}

export const DEFAULT_RALPH_CONFIG: RalphConfig = {
  maxTasksPerRun: 20,
  autoCommit: true,
  runTests: true,
  notifyOnComplete: true,
  pauseOnFail: true,
};
