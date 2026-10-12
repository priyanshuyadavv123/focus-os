import { describe, it, expect } from 'vitest';
import { aggregateAnalytics, formatRatioWithDenominator } from '@/features/analytics/aggregate';
import { FocusOSData, INITIAL_DATA } from '@/lib/storage';

describe('Analytics aggregate engine', () => {
  it('formats ratio with denominator cleanly and handles zero denominator', () => {
    expect(formatRatioWithDenominator(4, 5, 'tasks')).toBe('80.0% (4 of 5 tasks)');
    expect(formatRatioWithDenominator(0, 0, 'tasks')).toBe('0.0% (0 of 0 tasks)');
    expect(formatRatioWithDenominator(1, 3, 'milestones')).toBe('33.3% (1 of 3 milestones)');
  });

  it('reports hasEnoughData as false when under 3 days of recorded focus data', () => {
    const data: FocusOSData = {
      ...INITIAL_DATA,
      sessions: [
        {
          id: 's1',
          kind: 'focus',
          plannedSeconds: 1500,
          segments: [{ startMs: 1728000000000, endMs: 1728001500000 }],
          status: 'completed',
          lastSeenAt: 1728001500000,
          completedAt: 1728001500000,
        },
        {
          id: 's2',
          kind: 'focus',
          plannedSeconds: 1500,
          segments: [{ startMs: 1728086400000, endMs: 1728087900000 }],
          status: 'completed',
          lastSeenAt: 1728087900000,
          completedAt: 1728087900000,
        },
      ],
    };

    const result = aggregateAnalytics(data);
    expect(result.distinctDaysCount).toBe(2);
    expect(result.hasEnoughData).toBe(false);
    expect(result.totalFocusedMinutes).toBe(50); // 25 + 25
  });

  it('reports hasEnoughData as true and aggregates all metrics when 3+ days recorded', () => {
    const data: FocusOSData = {
      ...INITIAL_DATA,
      sessions: [
        {
          id: 's1',
          kind: 'focus',
          plannedSeconds: 1500,
          segments: [{ startMs: 1728000000000, endMs: 1728001500000 }], // 25m
          status: 'completed',
          lastSeenAt: 1728001500000,
          completedAt: 1728001500000,
        },
        {
          id: 's2',
          kind: 'focus',
          plannedSeconds: 1500,
          segments: [{ startMs: 1728086400000, endMs: 1728087900000 }], // 25m
          status: 'completed',
          lastSeenAt: 1728087900000,
          completedAt: 1728087900000,
        },
        {
          id: 's3',
          kind: 'focus',
          plannedSeconds: 1500,
          segments: [{ startMs: 1728172800000, endMs: 1728174000000 }], // 20m
          status: 'ended_early',
          lastSeenAt: 1728174000000,
          completedAt: 1728174000000,
        },
        {
          id: 's4_break',
          kind: 'shortBreak',
          plannedSeconds: 300,
          segments: [{ startMs: 1728174000000, endMs: 1728174300000 }], // Break ignored
          status: 'completed',
          lastSeenAt: 1728174300000,
        },
      ],
      tasks: [
        {
          id: 't1',
          title: 'Task 1',
          area: 'engineering',
          plannedMinutes: 50,
          scheduledDate: '2026-10-01',
          priority: 1,
          status: 'done',
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 't2',
          title: 'Task 2',
          area: 'business',
          plannedMinutes: 30,
          scheduledDate: '2026-10-01',
          priority: 2,
          status: 'todo',
          createdAt: '',
          updatedAt: '',
        },
      ],
      milestones: [
        {
          id: 'm1',
          semester: 'sem1',
          title: 'Milestone 1',
          criteria: [{ id: 'c1', text: 'Crit', done: true }],
          completed: true,
          targetDate: '2026-12-01',
        },
        {
          id: 'm2',
          semester: 'sem1',
          title: 'Milestone 2',
          criteria: [{ id: 'c2', text: 'Crit', done: false }],
          completed: false,
          targetDate: '2026-12-01',
        },
      ],
      prospects: [
        {
          id: 'p1',
          businessName: 'Clinic',
          websiteUrl: 'https://clinic.example.com',
          stage: 'won',
          observations: [],
          proposedSolution: 'Fix',
          effortHours: 3,
          priceRupees: 2500,
          notes: '',
        },
      ],
      revenueEntries: [
        {
          id: 'r1',
          date: '2026-10-02',
          amountRupees: 2500,
          costRupees: 500,
          note: 'Clinic payment',
        },
      ],
      researchNotes: [
        {
          id: 'rn1',
          question: 'Q1',
          status: 'done',
          sources: [],
          hypothesis: '',
          method: '',
          datasetAndPermissions: '',
          baseline: '',
          metrics: '',
          results: 'Done findings',
          limitations: '',
          nextExperiment: '',
        },
        {
          id: 'rn2',
          question: 'Q2',
          status: 'idea',
          sources: [],
          hypothesis: '',
          method: '',
          datasetAndPermissions: '',
          baseline: '',
          metrics: '',
          results: '',
          limitations: '',
          nextExperiment: '',
        },
      ],
    };

    const result = aggregateAnalytics(data);
    expect(result.distinctDaysCount).toBe(3);
    expect(result.hasEnoughData).toBe(true);
    expect(result.totalFocusedMinutes).toBe(70); // 25 + 25 + 20
    expect(result.completedSessionsCount).toBe(2); // s1, s2
    expect(result.tasksDoneCount).toBe(1);
    expect(result.tasksPlannedCount).toBe(2);
    expect(result.tasksCompletionFormatted).toBe('50.0% (1 of 2 tasks)');
    expect(result.milestonesCompletedCount).toBe(1);
    expect(result.milestonesTotalCount).toBe(2);
    expect(result.milestonesFormatted).toBe('50.0% (1 of 2 milestones)');
    expect(result.prospectsByStage['won']).toBe(1);
    expect(result.totalRevenueRupees).toBe(2500);
    expect(result.totalCostRupees).toBe(500);
    expect(result.netProfitRupees).toBe(2000);
    expect(result.experimentsCompletedCount).toBe(1);
  });
});
