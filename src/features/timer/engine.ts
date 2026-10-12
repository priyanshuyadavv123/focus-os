/**
 * Pure timer logic for FOCUS OS.
 * Must NOT import React.
 * Uses timestamps rather than decrementing counters.
 */

export type SessionKind = 'focus' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface TimerState {
  status: TimerStatus;
  kind: SessionKind;
  plannedSeconds: number;
  endsAt: number | null; // Timestamp in ms
  remainingMs: number;
  lastSeenAt: number;
}

export function createInitialTimerState(
  plannedSeconds: number = 25 * 60,
  kind: SessionKind = 'focus'
): TimerState {
  return {
    status: 'idle',
    kind,
    plannedSeconds,
    endsAt: null,
    remainingMs: plannedSeconds * 1000,
    lastSeenAt: Date.now(),
  };
}

export function calculateRemainingMs(state: TimerState, now: number = Date.now()): number {
  if (state.status !== 'running' || state.endsAt === null) {
    return state.remainingMs;
  }
  return Math.max(0, state.endsAt - now);
}
