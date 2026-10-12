/**
 * Pure Next Best Action logic for FOCUS OS.
 * Must NOT import React.
 * Rules are evaluated in strict priority order; the first match wins.
 *
 * Rules:
 * 1. A college deadline or exam within 48 hours.
 * 2. Unfinished work for a client who has said yes.
 * 3. A revenue action due today, such as a follow-up on a conversation the user has approved.
 * 4. The next unfinished item in the current semester's fundamentals.
 * 5. Research or review due today.
 * 6. The highest-priority unfinished task.
 */

import { Task } from '@/lib/storage';

export interface NextActionItem {
  task: Task | null;
  ruleMatched: number; // 1 to 6, or 0 if none
  explanation: string;
}

export interface TaskWithFlags extends Task {
  isExamWithin48h?: boolean;
  isClientWork?: boolean;
  isApprovedRevenueAction?: boolean;
  isSemesterFundamental?: boolean;
}

export function pickNextBestAction(tasks: TaskWithFlags[]): NextActionItem {
  const pendingTasks = tasks.filter((t) => t.status === 'todo');

  if (pendingTasks.length === 0) {
    return {
      task: null,
      ruleMatched: 0,
      explanation: 'No pending tasks scheduled for today.',
    };
  }

  // Rule 1: A college deadline or exam within 48 hours
  const rule1Match = pendingTasks.find((t) => t.isExamWithin48h === true);
  if (rule1Match) {
    return {
      task: rule1Match,
      ruleMatched: 1,
      explanation: `Matched rule 1: college deadline or exam within 48 hours (${rule1Match.title}).`,
    };
  }

  // Rule 2: Unfinished work for a client who has said yes
  const rule2Match = pendingTasks.find((t) => t.isClientWork === true);
  if (rule2Match) {
    return {
      task: rule2Match,
      ruleMatched: 2,
      explanation: `Matched rule 2: client delivery work (${rule2Match.title}).`,
    };
  }

  // Rule 3: A revenue action due today (e.g. approved follow-up)
  const rule3Match = pendingTasks.find((t) => t.isApprovedRevenueAction === true);
  if (rule3Match) {
    return {
      task: rule3Match,
      ruleMatched: 3,
      explanation: `Matched rule 3: revenue action due today (${rule3Match.title}).`,
    };
  }

  // Rule 4: The next unfinished item in current semester's fundamentals
  const rule4Match = pendingTasks.find((t) => t.isSemesterFundamental === true);
  if (rule4Match) {
    return {
      task: rule4Match,
      ruleMatched: 4,
      explanation: `Matched rule 4: semester fundamentals (${rule4Match.title}).`,
    };
  }

  // Rule 5: Research or review due today
  const rule5Match = pendingTasks.find((t) => t.area === 'research');
  if (rule5Match) {
    return {
      task: rule5Match,
      ruleMatched: 5,
      explanation: `Matched rule 5: research experiment or review (${rule5Match.title}).`,
    };
  }

  // Rule 6: Highest-priority unfinished task (priority 1 is highest)
  const sorted = [...pendingTasks].sort((a, b) => a.priority - b.priority);
  const highest = sorted[0];

  return {
    task: highest ?? null,
    ruleMatched: 6,
    explanation: highest
      ? `Matched rule 6: highest-priority unfinished task (${highest.title}).`
      : 'No pending tasks scheduled for today.',
  };
}

export function enforceDailyBudget(
  tasks: Task[],
  dailyBudgetMinutes: number = 180
): { includedTasks: Task[]; deferredTasks: Task[]; totalPlannedMinutes: number } {
  let accumulatedMinutes = 0;
  const includedTasks: Task[] = [];
  const deferredTasks: Task[] = [];

  // Sort by priority (1 highest)
  const sorted = [...tasks].sort((a, b) => a.priority - b.priority);

  for (const task of sorted) {
    if (accumulatedMinutes + task.plannedMinutes <= dailyBudgetMinutes) {
      accumulatedMinutes += task.plannedMinutes;
      includedTasks.push(task);
    } else {
      deferredTasks.push(task);
    }
  }

  return {
    includedTasks,
    deferredTasks,
    totalPlannedMinutes: accumulatedMinutes,
  };
}
