import { describe, it, expect } from 'vitest';
import { determineNextAction } from '@/features/dashboard/nextAction';
import { Task } from '@/lib/storage';

describe('pure nextAction rules', () => {
  it('returns null when no tasks exist', () => {
    const result = determineNextAction([]);
    expect(result.task).toBeNull();
    expect(result.ruleExplanation).toContain('No pending tasks');
  });

  it('selects highest-priority unfinished task according to rule 6', () => {
    const tasks: Task[] = [
      {
        id: 'task-1',
        title: 'Review notes',
        area: 'engineering',
        plannedMinutes: 30,
        scheduledDate: '2026-10-12',
        priority: 3,
        status: 'todo',
        createdAt: '2026-10-12',
        updatedAt: '2026-10-12',
      },
      {
        id: 'task-2',
        title: 'Python loop exercises',
        area: 'engineering',
        plannedMinutes: 50,
        scheduledDate: '2026-10-12',
        priority: 1,
        status: 'todo',
        createdAt: '2026-10-12',
        updatedAt: '2026-10-12',
      },
    ];

    const result = determineNextAction(tasks);
    expect(result.task?.id).toBe('task-2');
    expect(result.ruleExplanation).toContain('Matched rule 6');
  });
});
