import { describe, it, expect } from 'vitest';
import {
  TEMPLATES,
  calculateBackToBackTimeline,
  formatTimeFromMinutes,
  calculateBudgetMinutes,
  PROTECTED_TIME_DEFAULTS,
} from '@/features/planner/plannerEngine';

describe('Pure Planner Engine Specifications', () => {
  it('verifies default blocks sum up to exactly 180 minutes', () => {
    const total = calculateBudgetMinutes(TEMPLATES.default);
    expect(total).toBe(180);
    expect(TEMPLATES.default.map((b) => b.minutes)).toEqual([50, 70, 30, 20, 10]);
  });

  it('verifies exam-day and weekend templates sum up to exactly 180 minutes', () => {
    expect(calculateBudgetMinutes(TEMPLATES.exam)).toBe(180);
    expect(calculateBudgetMinutes(TEMPLATES.weekend)).toBe(180);
  });

  it('calculates back-to-back blocks without any overlaps', () => {
    const startMinutes = 9 * 60; // 09:00
    const scheduled = calculateBackToBackTimeline(TEMPLATES.default, startMinutes);

    expect(scheduled[0]?.startMinutesFromMidnight).toBe(540); // 09:00
    expect(scheduled[0]?.endMinutesFromMidnight).toBe(590); // 09:50
    expect(scheduled[1]?.startMinutesFromMidnight).toBe(590); // 09:50
    expect(scheduled[1]?.endMinutesFromMidnight).toBe(660); // 11:00
    expect(scheduled[4]?.endMinutesFromMidnight).toBe(720); // 12:00

    expect(formatTimeFromMinutes(scheduled[0]!.startMinutesFromMidnight!)).toBe('09:00');
    expect(formatTimeFromMinutes(scheduled[4]!.endMinutesFromMidnight!)).toBe('12:00');
  });

  it('excludes protected time (classes, sleep, personal) from 180m work budget', () => {
    const combined = [...TEMPLATES.default, ...PROTECTED_TIME_DEFAULTS];
    const workBudget = calculateBudgetMinutes(combined);
    expect(workBudget).toBe(180);
  });
});
