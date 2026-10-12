import { describe, it, expect } from 'vitest';
import {
  pickNextBestAction,
  enforceDailyBudget,
  TaskWithFlags,
} from '@/features/dashboard/nextAction';
import { Task } from '@/lib/storage';

describe('Pure Next Best Action Rules', () => {
  const baseTask: Task = {
    id: 'base',
    title: 'Base Task',
    area: 'engineering',
    plannedMinutes: 30,
    scheduledDate: '2026-10-12',
    priority: 3,
    status: 'todo',
    createdAt: '2026-10-12',
    updatedAt: '2026-10-12',
  };

  it('selects Rule 1 (college deadline or exam within 48h) first over other pending tasks', () => {
    const tasks: TaskWithFlags[] = [
      { ...baseTask, id: 't-client', title: 'Client website fix', isClientWork: true, priority: 1 },
      { ...baseTask, id: 't-exam', title: 'Data Structures Midterm', isExamWithin48h: true, priority: 2 },
    ];

    const result = pickNextBestAction(tasks);
    expect(result.ruleMatched).toBe(1);
    expect(result.task?.id).toBe('t-exam');
    expect(result.explanation).toContain('Matched rule 1');
  });

  it('selects Rule 2 (client work) when no 48h exam is pending', () => {
    const tasks: TaskWithFlags[] = [
      { ...baseTask, id: 't-rev', title: 'Follow-up proposal', isApprovedRevenueAction: true, priority: 1 },
      { ...baseTask, id: 't-client', title: 'Client hero section', isClientWork: true, priority: 2 },
    ];

    const result = pickNextBestAction(tasks);
    expect(result.ruleMatched).toBe(2);
    expect(result.task?.id).toBe('t-client');
    expect(result.explanation).toContain('Matched rule 2');
  });

  it('selects Rule 3 (revenue action due today) when no client work is pending', () => {
    const tasks: TaskWithFlags[] = [
      { ...baseTask, id: 't-fund', title: 'Python loops lesson', isSemesterFundamental: true },
      { ...baseTask, id: 't-rev', title: 'Approved follow up message', isApprovedRevenueAction: true },
    ];

    const result = pickNextBestAction(tasks);
    expect(result.ruleMatched).toBe(3);
    expect(result.task?.id).toBe('t-rev');
    expect(result.explanation).toContain('Matched rule 3');
  });

  it('selects Rule 4 (semester fundamentals) when no higher rule matches', () => {
    const tasks: TaskWithFlags[] = [
      { ...baseTask, id: 't-res', title: 'Literature review notes', area: 'research' },
      { ...baseTask, id: 't-fund', title: 'Python loops exercise', isSemesterFundamental: true },
    ];

    const result = pickNextBestAction(tasks);
    expect(result.ruleMatched).toBe(4);
    expect(result.task?.id).toBe('t-fund');
    expect(result.explanation).toContain('Matched rule 4');
  });

  it('selects Rule 5 (research or review due today)', () => {
    const tasks: TaskWithFlags[] = [
      { ...baseTask, id: 't-general', title: 'Clean up room', area: 'health', priority: 2 },
      { ...baseTask, id: 't-res', title: 'Analyze evaluation metrics', area: 'research', priority: 3 },
    ];

    const result = pickNextBestAction(tasks);
    expect(result.ruleMatched).toBe(5);
    expect(result.task?.id).toBe('t-res');
    expect(result.explanation).toContain('Matched rule 5');
  });

  it('selects Rule 6 (highest-priority unfinished task) as ultimate fallback', () => {
    const tasks: TaskWithFlags[] = [
      { ...baseTask, id: 't-p3', title: 'Low priority health check', priority: 3 },
      { ...baseTask, id: 't-p1', title: 'High priority system fix', priority: 1 },
    ];

    const result = pickNextBestAction(tasks);
    expect(result.ruleMatched).toBe(6);
    expect(result.task?.id).toBe('t-p1');
    expect(result.explanation).toContain('Matched rule 6');
  });

  it('enforces 180-minute daily budget constraint and moves overflow to deferred', () => {
    const tasks: Task[] = [
      { ...baseTask, id: 't-1', plannedMinutes: 70, priority: 1 },
      { ...baseTask, id: 't-2', plannedMinutes: 60, priority: 2 },
      { ...baseTask, id: 't-3', plannedMinutes: 40, priority: 2 },
      { ...baseTask, id: 't-4', plannedMinutes: 50, priority: 3 }, // 70+60+40 = 170m; +50 exceeds 180!
    ];

    const { includedTasks, deferredTasks, totalPlannedMinutes } = enforceDailyBudget(tasks, 180);
    expect(includedTasks.length).toBe(3);
    expect(totalPlannedMinutes).toBe(170);
    expect(deferredTasks.length).toBe(1);
    expect(deferredTasks[0]?.id).toBe('t-4');
  });
});
