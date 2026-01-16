/**
 * RALPH - Relentless Autonomous Launch & Progress Handler
 *
 * Autonomous agent for shipping features overnight.
 * Converts feature descriptions into PRDs, splits into atomic tasks,
 * and tracks progress across sessions.
 *
 * USAGE:
 *   "RALPH, build [feature description]" - Start new feature
 *   "RALPH, status" - Check current progress
 *   "RALPH, next" - Get next task
 *   "RALPH, done [task-id]" - Mark task complete
 *   "RALPH, fail [task-id] [reason]" - Mark task failed
 *   "RALPH, clear" - Reset and start fresh
 *
 * WORKFLOW:
 *   1. User describes feature
 *   2. RALPH generates PRD
 *   3. PRD split into atomic tasks
 *   4. Tasks executed one by one
 *   5. Each task: implement → test → commit
 *   6. Progress persists in .claude/memory/
 */

import { generatePRD } from './prd-generator';
import { splitIntoTasks, estimateTaskTime } from './story-splitter';
import {
  loadProgress,
  saveProgress,
  initializeProgress,
  updateTaskStatus,
  getNextTask,
  clearProgress,
  generateProgressReport,
  logCompletedPrd,
} from './progress';
import { RalphProgress, RalphTask, RalphPRD, RalphConfig, DEFAULT_RALPH_CONFIG } from './types';

export * from './types';
export { generatePRD } from './prd-generator';
export { splitIntoTasks, estimateTaskTime } from './story-splitter';
export {
  loadProgress,
  saveProgress,
  getNextTask,
  clearProgress,
  generateProgressReport,
} from './progress';

/**
 * Start a new RALPH session for a feature
 */
export async function startRalph(
  featureDescription: string,
  config: Partial<RalphConfig> = {}
): Promise<{
  prd: RalphPRD;
  tasks: RalphTask[];
  estimate: string;
  summary: string;
}> {
  const mergedConfig = { ...DEFAULT_RALPH_CONFIG, ...config };

  console.log('[RALPH] Starting new session...');
  console.log(`[RALPH] Feature: "${featureDescription.slice(0, 100)}..."`);

  // Step 1: Generate PRD
  console.log('[RALPH] Generating PRD...');
  const prd = await generatePRD(featureDescription);
  console.log(`[RALPH] PRD created: ${prd.id} - ${prd.title}`);

  // Step 2: Split into tasks
  console.log('[RALPH] Splitting into atomic tasks...');
  const tasks = await splitIntoTasks(prd);
  console.log(`[RALPH] Created ${tasks.length} tasks`);

  // Step 3: Estimate time
  const estimate = estimateTaskTime(tasks);
  console.log(`[RALPH] Estimated time: ${estimate}`);

  // Step 4: Initialize progress
  const progress = initializeProgress(prd, tasks);
  await saveProgress(progress);
  console.log('[RALPH] Progress saved to .claude/memory/ralph-progress.json');

  // Generate summary
  const summary = formatRalphSummary(prd, tasks, estimate);

  return { prd, tasks, estimate, summary };
}

/**
 * Resume an existing RALPH session
 */
export async function resumeRalph(): Promise<{
  progress: RalphProgress | null;
  nextTask: RalphTask | null;
  summary: string;
}> {
  const progress = await loadProgress();

  if (!progress) {
    return {
      progress: null,
      nextTask: null,
      summary: 'No active RALPH session. Run `RALPH, build [feature]` to start.',
    };
  }

  const nextTask = await getNextTask();
  const summary = await generateProgressReport();

  return { progress, nextTask, summary };
}

/**
 * Complete a task
 */
export async function completeTask(
  taskId: string,
  commitHash?: string,
  notes?: string
): Promise<RalphProgress | null> {
  console.log(`[RALPH] Completing task ${taskId}...`);
  const progress = await updateTaskStatus(taskId, 'completed', notes, commitHash);

  if (progress && progress.completedTasks === progress.totalTasks) {
    console.log('[RALPH] All tasks completed! 🎉');
    if (progress.currentPrd) {
      await logCompletedPrd(progress.currentPrd, progress.tasks);
    }
  }

  return progress;
}

/**
 * Fail a task
 */
export async function failTask(
  taskId: string,
  error: string
): Promise<RalphProgress | null> {
  console.log(`[RALPH] Failing task ${taskId}: ${error}`);
  return updateTaskStatus(taskId, 'failed', error);
}

/**
 * Block a task
 */
export async function blockTask(
  taskId: string,
  blocker: string
): Promise<RalphProgress | null> {
  console.log(`[RALPH] Blocking task ${taskId}: ${blocker}`);
  return updateTaskStatus(taskId, 'blocked', `BLOCKED: ${blocker}`);
}

/**
 * Format a nice summary of RALPH session
 */
function formatRalphSummary(
  prd: RalphPRD,
  tasks: RalphTask[],
  estimate: string
): string {
  const taskList = tasks
    .map((t, i) => `   ${i + 1}. [${t.complexity}] ${t.title}`)
    .join('\n');

  return `
## RALPH Session Started

### PRD: ${prd.title}
${prd.description}

**Goal:** ${prd.goal}

### Tasks (${tasks.length} total, ${estimate})
${taskList}

### Success Criteria
${prd.successCriteria.map(c => `- ${c}`).join('\n')}

---
**Next:** Run \`RALPH, next\` to get the first task, or review the PRD above.
**Progress saved to:** \`.claude/memory/ralph-progress.json\`
`;
}

/**
 * Parse RALPH commands from user input
 */
export function parseRalphCommand(input: string): {
  command: 'build' | 'status' | 'next' | 'done' | 'fail' | 'clear' | 'help' | null;
  args: string[];
} {
  const lower = input.toLowerCase().trim();

  // Check if this is a RALPH command
  if (!lower.startsWith('ralph')) {
    return { command: null, args: [] };
  }

  // Remove "ralph" prefix and parse
  const rest = input.slice(5).trim();

  // Handle "ralph, build X" or "ralph build X"
  const cleanedRest = rest.startsWith(',') ? rest.slice(1).trim() : rest;
  const parts = cleanedRest.split(/\s+/);
  const cmd = parts[0]?.toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case 'build':
      return { command: 'build', args: [parts.slice(1).join(' ')] };
    case 'status':
      return { command: 'status', args: [] };
    case 'next':
      return { command: 'next', args: [] };
    case 'done':
    case 'complete':
      return { command: 'done', args };
    case 'fail':
    case 'failed':
      return { command: 'fail', args };
    case 'clear':
    case 'reset':
      return { command: 'clear', args: [] };
    case 'help':
    case '?':
      return { command: 'help', args: [] };
    default:
      // If no command, treat the rest as a build description
      if (cleanedRest.length > 0) {
        return { command: 'build', args: [cleanedRest] };
      }
      return { command: 'help', args: [] };
  }
}

/**
 * Get RALPH help text
 */
export function getRalphHelp(): string {
  return `
## RALPH - Relentless Autonomous Launch & Progress Handler

**Commands:**
- \`RALPH, build [description]\` - Start building a new feature
- \`RALPH, status\` - View current progress
- \`RALPH, next\` - Get the next task to work on
- \`RALPH, done [task-id]\` - Mark a task as complete
- \`RALPH, fail [task-id] [reason]\` - Mark a task as failed
- \`RALPH, clear\` - Reset and start fresh

**Example:**
\`\`\`
RALPH, build Fix airtime category images - the current curated images don't look like airtime vendors
\`\`\`

**How it works:**
1. You describe what you want to build
2. RALPH creates a PRD (Product Requirements Document)
3. PRD is split into atomic, testable tasks
4. Work through tasks one by one
5. Progress is saved in \`.claude/memory/\` (persists across sessions)

**Files:**
- \`.claude/memory/agents.md\` - Long-term project memory
- \`.claude/memory/ralph-progress.json\` - Current session progress
`;
}
