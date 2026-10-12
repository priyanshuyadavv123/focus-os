/**
 * Pure Analytics Aggregation logic for FOCUS OS.
 * Must NOT import React.
 * Uses recorded sessions only.
 */

import { FocusSession, Task, RevenueEntry } from '@/lib/storage';

export interface AnalyticsSummary {
  focusedMinutes: number;
  completedSessions: number;
  tasksDone: number;
  tasksPlanned: number;
  totalRevenueRupees: number;
  totalCostRupees: number;
  netProfitRupees: number;
}

export function aggregateMetrics(
  sessions: FocusSession[],
  tasks: Task[],
  revenueEntries: RevenueEntry[]
): AnalyticsSummary {
  let totalFocusMs = 0;
  let completedSessions = 0;

  for (const session of sessions) {
    if (session.kind === 'focus') {
      if (session.status === 'completed') {
        completedSessions++;
      }
      for (const segment of session.segments) {
        if (segment.endMs > segment.startMs) {
          totalFocusMs += segment.endMs - segment.startMs;
        }
      }
    }
  }

  const tasksDone = tasks.filter((t) => t.status === 'done').length;
  const tasksPlanned = tasks.length;

  let totalRevenueRupees = 0;
  let totalCostRupees = 0;

  for (const entry of revenueEntries) {
    totalRevenueRupees += entry.amountRupees;
    totalCostRupees += entry.costRupees;
  }

  return {
    focusedMinutes: Math.floor(totalFocusMs / (1000 * 60)),
    completedSessions,
    tasksDone,
    tasksPlanned,
    totalRevenueRupees,
    totalCostRupees,
    netProfitRupees: totalRevenueRupees - totalCostRupees,
  };
}
