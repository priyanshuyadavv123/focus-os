import { describe, it, expect } from 'vitest';
import roadmapData from '@/features/roadmap/roadmap.json';
import {
  isMilestoneComplete,
  calculateSemesterProgress,
  RoadmapSemester,
} from '@/features/roadmap/roadmapLogic';

describe('Pure Roadmap Logic Specifications', () => {
  it('contains exactly 8 semesters with goals, milestones, and summer targets', () => {
    expect(roadmapData.semesters.length).toBe(8);
    for (const sem of roadmapData.semesters) {
      expect(sem.goals.length).toBeGreaterThan(0);
      expect(sem.milestones.length).toBeGreaterThan(0);
      expect(sem.summerTarget).toBeDefined();
    }
  });

  it('completes milestone only when all criteria are checked', () => {
    const incompleteCriteria = [
      { id: '1', text: 'Task 1', done: true },
      { id: '2', text: 'Task 2', done: false },
    ];
    expect(isMilestoneComplete(incompleteCriteria)).toBe(false);

    const completeCriteria = [
      { id: '1', text: 'Task 1', done: true },
      { id: '2', text: 'Task 2', done: true },
    ];
    expect(isMilestoneComplete(completeCriteria)).toBe(true);
  });

  it('calculates semester progress accurately from verified criteria completeness', () => {
    const sampleSemester: RoadmapSemester = {
      id: 'test',
      number: 1,
      year: 1,
      title: 'Test',
      focus: 'Test',
      goals: ['Goal 1'],
      summerTarget: 'Summer',
      milestones: [
        {
          id: 'm1',
          title: 'M1',
          targetDate: '2026-12-01',
          criteria: [{ id: 'c1', text: 'Crit 1', done: true }],
        },
        {
          id: 'm2',
          title: 'M2',
          targetDate: '2026-12-15',
          criteria: [
            { id: 'c2', text: 'Crit 2', done: true },
            { id: 'c3', text: 'Crit 3', done: false },
          ],
        },
      ],
    };

    const progress = calculateSemesterProgress(sampleSemester);
    expect(progress.totalMilestones).toBe(2);
    expect(progress.completedMilestones).toBe(1);
    expect(progress.percentage).toBe(50);
  });
});
