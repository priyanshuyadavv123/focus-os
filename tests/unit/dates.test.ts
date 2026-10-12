import { describe, it, expect } from 'vitest';
import { getTodayDateString, isValidDateString } from '@/lib/dates';

describe('dates utility', () => {
  it('formats current date in Asia/Kolkata timezone as YYYY-MM-DD', () => {
    // 2026-10-12T11:30:00Z is 2026-10-12 17:00:00 in Asia/Kolkata (+05:30)
    const fixedUtc = new Date('2026-10-12T11:30:00Z');
    const kolkataDate = getTodayDateString(fixedUtc);
    expect(kolkataDate).toBe('2026-10-12');
  });

  it('validates YYYY-MM-DD format strictly', () => {
    expect(isValidDateString('2026-10-12')).toBe(true);
    expect(isValidDateString('2026-1-1')).toBe(false);
    expect(isValidDateString('12-10-2026')).toBe(false);
    expect(isValidDateString('invalid')).toBe(false);
  });
});
