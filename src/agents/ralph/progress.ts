/**
 * RALPH - Progress Tracker
 * Manages task progress and persistence across sessions
 */

import { promises as fs } from 'fs';
import path from 'path';
import { RalphProgress, RalphTask, RalphPRD } from './types';

// Progress file location (persists across sessions)
const PROGRESS_FILE = path.join(process.cwd(), '.claude', 'memory', 'ralph-progress.json');
const AGENTS_MD_FILE = path.join(process.cwd(), '.claude', 'memory', 'agents.md');

/**
 * Load current progress from file
 */
export async function loadProgress(): Promise<RalphProgress | null> {
  try {
    const data = await fs.readFile(PROGRESS_FILE, 'utf-8');
    return JSON.parse(data) as RalphProgress;
  } catch {
    return null;
  }
}

/**
 * Save progress to file
 */
export async function saveProgress(progress: RalphProgress): Promise<void> {
  try {
    // Ensure directory exists
    await fs.mkdir(path.dirname(PROGRESS_FILE), { recursive: true });
    await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));

    // Also update agents.md with current sprint status
    await updateAgentsMd(progress);
  } catch (error) {
    console.error('[RALPH] Failed to save progress:', error);
  }
}

/**
 * Initialize new progress for a PRD
 */
export function initializeProgress(prd: RalphPRD, tasks: RalphTask[]): RalphProgress {
  return {
    currentPrd: prd,
    tasks,
    currentTaskIndex: 0,
    startedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    totalTasks: tasks.length,
    completedTasks: 0,
    failedTasks: 0,
    isRunning: false,
  };
}

/**
 * Update a task's status
 */
export async function updateTaskStatus(
  taskId: string,
  status: RalphTask['status'],
  notes?: string,
  commit?: string
): Promise<RalphProgress | null> {
  const progress = await loadProgress();
  if (!progress) return null;

  const taskIndex = progress.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return progress;

  const task = progress.tasks[taskIndex];
  task.status = status;

  if (status === 'in_progress' && !task.startedAt) {
    task.startedAt = new Date().toISOString();
  }

  if (status === 'completed') {
    task.completedAt = new Date().toISOString();
    progress.completedTasks++;
  }

  if (status === 'failed') {
    progress.failedTasks++;
  }

  if (notes) {
    task.notes.push(notes);
  }

  if (commit) {
    task.commits.push(commit);
  }

  progress.lastUpdated = new Date().toISOString();

  await saveProgress(progress);
  return progress;
}

/**
 * Get next pending task
 */
export async function getNextTask(): Promise<RalphTask | null> {
  const progress = await loadProgress();
  if (!progress) return null;

  return progress.tasks.find(t => t.status === 'pending') || null;
}

/**
 * Clear progress (start fresh)
 */
export async function clearProgress(): Promise<void> {
  try {
    await fs.unlink(PROGRESS_FILE);
  } catch {
    // File doesn't exist, that's fine
  }
}

/**
 * Generate a progress report
 */
export async function generateProgressReport(): Promise<string> {
  const progress = await loadProgress();
  if (!progress) {
    return 'No active RALPH session. Run `RALPH, build [feature]` to start.';
  }

  const { currentPrd, tasks, completedTasks, failedTasks, totalTasks, isRunning } = progress;

  const statusEmoji = {
    pending: '⏳',
    in_progress: '🔄',
    completed: '✅',
    failed: '❌',
    blocked: '🚫',
  };

  let report = `## RALPH Progress Report\n\n`;
  report += `**PRD:** ${currentPrd?.title || 'Unknown'}\n`;
  report += `**Status:** ${isRunning ? '🏃 Running' : '⏸️ Paused'}\n`;
  report += `**Progress:** ${completedTasks}/${totalTasks} tasks (${failedTasks} failed)\n\n`;
  report += `### Tasks\n\n`;

  for (const task of tasks) {
    report += `${statusEmoji[task.status]} **${task.id}**: ${task.title}\n`;
    if (task.status === 'failed' && task.error) {
      report += `   └─ Error: ${task.error}\n`;
    }
    if (task.commits.length > 0) {
      report += `   └─ Commits: ${task.commits.join(', ')}\n`;
    }
  }

  return report;
}

/**
 * Update agents.md with current sprint status
 */
async function updateAgentsMd(progress: RalphProgress): Promise<void> {
  try {
    let content = await fs.readFile(AGENTS_MD_FILE, 'utf-8');

    // Generate new task table
    const taskRows = progress.tasks.map(t =>
      `| ${t.id} | ${t.title.slice(0, 40)} | ${t.status} | ${t.commits.join(', ') || '-'} | ${t.notes[0]?.slice(0, 30) || '-'} |`
    ).join('\n');

    const newTable = `### Current Sprint
| ID | Task | Status | Commits | Notes |
|----|------|--------|---------|-------|
${taskRows || '| - | No active tasks | - | - | - |'}`;

    // Replace the current sprint section
    const sprintRegex = /### Current Sprint[\s\S]*?(?=###|## |$)/;
    if (sprintRegex.test(content)) {
      content = content.replace(sprintRegex, newTable + '\n\n');
    }

    await fs.writeFile(AGENTS_MD_FILE, content);
  } catch (error) {
    console.error('[RALPH] Failed to update agents.md:', error);
  }
}

/**
 * Log a completed PRD to memory
 */
export async function logCompletedPrd(
  prd: RalphPRD,
  tasks: RalphTask[]
): Promise<void> {
  try {
    let content = await fs.readFile(AGENTS_MD_FILE, 'utf-8');

    const commits = tasks.flatMap(t => t.commits);
    const completedRow = `| ${prd.id} | ${prd.title.slice(0, 40)} | ${new Date().toISOString().split('T')[0]} | ${commits.join(', ') || '-'} |`;

    // Add to completed tasks section
    const completedRegex = /### Completed Tasks\n\| ID \| Task \| Completed \| Commits \|\n\|----\|------\|-----------\|---------\|\n/;
    if (completedRegex.test(content)) {
      content = content.replace(
        completedRegex,
        `### Completed Tasks\n| ID | Task | Completed | Commits |\n|----|------|-----------|--------|\n${completedRow}\n`
      );
    }

    await fs.writeFile(AGENTS_MD_FILE, content);
  } catch (error) {
    console.error('[RALPH] Failed to log completed PRD:', error);
  }
}
