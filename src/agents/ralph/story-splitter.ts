/**
 * RALPH - Story Splitter
 * Converts a PRD into atomic, executable user stories/tasks
 */

import Anthropic from '@anthropic-ai/sdk';
import { RalphPRD, RalphTask } from './types';

const anthropic = new Anthropic();

/**
 * Split a PRD into atomic tasks
 */
export async function splitIntoTasks(prd: RalphPRD): Promise<RalphTask[]> {
  const systemPrompt = `You are RALPH, breaking down a PRD into atomic, executable tasks.

RULES FOR GOOD TASKS:
1. Each task should be completable in 5-15 minutes
2. Each task should touch 1-3 files maximum
3. Each task should have clear acceptance criteria
4. Tasks should be ordered by dependency (do X before Y)
5. No vague tasks - be specific about what changes

COMPLEXITY GUIDE:
- tiny: Single line change, config update
- small: Single function, few lines
- medium: Multiple functions, logic changes
- large: New file, significant feature

OUTPUT FORMAT (JSON array only, no markdown):
[
  {
    "id": "TASK-001",
    "title": "Short title",
    "description": "What to do",
    "acceptanceCriteria": ["When X, then Y", "File Z contains..."],
    "filesToModify": ["path/to/file.ts"],
    "filesToCreate": [],
    "complexity": "small",
    "order": 1
  }
]`;

  const userPrompt = `Break this PRD into atomic tasks:

PRD ID: ${prd.id}
Title: ${prd.title}
Description: ${prd.description}
Goal: ${prd.goal}
Success Criteria: ${prd.successCriteria.join(', ')}
Technical Notes: ${prd.technicalNotes.join(', ')}

Return ONLY a valid JSON array, no markdown.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse JSON array from response
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }

    const tasks = JSON.parse(jsonMatch[0]) as Partial<RalphTask>[];

    // Normalize and add metadata
    return tasks.map((task, index) => ({
      id: task.id || `TASK-${(index + 1).toString().padStart(3, '0')}`,
      prdId: prd.id,
      title: task.title || `Task ${index + 1}`,
      description: task.description || '',
      acceptanceCriteria: task.acceptanceCriteria || [],
      filesToModify: task.filesToModify || [],
      filesToCreate: task.filesToCreate || [],
      complexity: task.complexity || 'small',
      order: task.order || index + 1,
      status: 'pending' as const,
      commits: [],
      notes: [],
    }));
  } catch (error) {
    console.error('[RALPH] Story splitting failed:', error);

    // Return a single task on failure
    return [{
      id: 'TASK-001',
      prdId: prd.id,
      title: prd.title,
      description: prd.description,
      acceptanceCriteria: prd.successCriteria,
      filesToModify: [],
      filesToCreate: [],
      complexity: 'medium',
      order: 1,
      status: 'pending',
      commits: [],
      notes: [],
    }];
  }
}

/**
 * Estimate total time for a set of tasks
 */
export function estimateTaskTime(tasks: RalphTask[]): string {
  const timeMap = {
    tiny: 5,
    small: 10,
    medium: 20,
    large: 45,
  };

  const totalMinutes = tasks.reduce((sum, task) => sum + timeMap[task.complexity], 0);

  if (totalMinutes < 60) {
    return `~${totalMinutes} minutes`;
  }

  const hours = Math.ceil(totalMinutes / 60);
  return `~${hours} hour${hours > 1 ? 's' : ''}`;
}
