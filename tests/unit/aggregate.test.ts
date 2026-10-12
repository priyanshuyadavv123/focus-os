import { describe, it, expect } from 'vitest';
import { aggregateMetrics } from '@/features/analytics/aggregate';
import { FocusSession, Task, RevenueEntry } from '@/lib/storage';

describe('pure analytics aggregation', () => {
  it('aggregates recorded focus segments and revenue correctly', () => {
    const sessions: FocusSession[] = [
      {
        id: 's-1',
        kind: 'focus',
        plannedSeconds: 1500,
        segments: [
          { startMs: 1000, endMs: 1000 + 25 * 60 * 1000 }, // 25 mins
        ],
        status: 'completed',
        lastSeenAt: 1000 + 25 * 60 * 1000,
      },
      {
        id: 's-2',
        kind: 'shortBreak', // breaks must NOT count as focus time
        plannedSeconds: 300,
        segments: [{ startMs: 2000, endMs: 2000 + 5 * 60 * 1000 }],
        status: 'completed',
        lastSeenAt: 2000 + 5 * 60 * 1000,
      },
    ];

    const tasks: Task[] = [
      {
        id: 't-1',
        title: 'Task 1',
        area: 'engineering',
        plannedMinutes: 50,
        scheduledDate: '2026-10-12',
        priority: 1,
        status: 'done',
        createdAt: '2026-10-12',
        updatedAt: '2026-10-12',
      },
      {
        id: 't-2',
        title: 'Task 2',
        area: 'engineering',
        plannedMinutes: 50,
        scheduledDate: '2026-10-12',
        priority: 2,
        status: 'todo',
        createdAt: '2026-10-12',
        updatedAt: '2026-10-12',
      },
    ];

    const revenue: RevenueEntry[] = [
      {
        id: 'r-1',
        date: '2026-10-12',
        amountRupees: 2500,
        costRupees: 200,
        note: 'Landing page fix',
      },
    ];

    const summary = aggregateMetrics(sessions, tasks, revenue);
    expect(summary.focusedMinutes).toBe(25);
    expect(summary.completedSessions).toBe(1);
    expect(summary.tasksDone).toBe(1);
    expect(summary.tasksPlanned).toBe(2);
    expect(summary.totalRevenueRupees).toBe(2500);
    expect(summary.totalCostRupees).toBe(200);
    expect(summary.netProfitRupees).toBe(2300);
  });
});
