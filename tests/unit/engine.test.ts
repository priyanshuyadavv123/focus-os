import { describe, it, expect } from 'vitest';
import {
  createInitialTimerState,
  calculateRemainingMs,
  TimerState,
} from '@/features/timer/engine';

describe('pure timer engine', () => {
  it('creates initial timer state with planned seconds', () => {
    const state = createInitialTimerState(25 * 60, 'focus');
    expect(state.status).toBe('idle');
    expect(state.plannedSeconds).toBe(1500);
    expect(state.remainingMs).toBe(1500 * 1000);
    expect(state.endsAt).toBeNull();
  });

  it('calculates remaining time from endsAt timestamp without decrementing counters', () => {
    const now = 1_000_000;
    const runningState: TimerState = {
      status: 'running',
      kind: 'focus',
      plannedSeconds: 1500,
      endsAt: now + 5000,
      remainingMs: 5000,
      lastSeenAt: now,
    };

    expect(calculateRemainingMs(runningState, now)).toBe(5000);
    expect(calculateRemainingMs(runningState, now + 2000)).toBe(3000);
    expect(calculateRemainingMs(runningState, now + 6000)).toBe(0);
  });
});
