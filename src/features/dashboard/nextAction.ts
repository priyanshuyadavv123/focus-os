/**
 * Pure Next Best Action logic for FOCUS OS Dashboard.
 * Must NOT import React.
 * Evaluates rules 1 to 6 in priority order.
 */

import { Task } from '@/lib/storage';

export interface NextActionResult {
  task: Task | null;
  ruleExplanation: string;
}

export function determineNextAction(tasks: Task[]): NextActionResult {
  const todoTasks = tasks.filter((t) => t.status === 'todo');

  if (todoTasks.length === 0) {
    return {
      task: null,
      ruleExplanation: 'No pending tasks scheduled.',
    };
  }

  // Fallback to Rule 6: Highest-priority unfinished task (priority 1 is highest)
  const sorted = [...todoTasks].sort((a, b) => a.priority - b.priority);
  const highest = sorted[0];

  return {
    task: highest ?? null,
    ruleExplanation: highest
      ? `Matched rule 6: highest-priority unfinished task (${highest.title}).`
      : 'No pending tasks scheduled.',
  };
}
