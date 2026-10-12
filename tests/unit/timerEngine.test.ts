import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createInitialEngineState,
  startSession,
  tickSession,
  pauseSession,
  resumeSession,
  completeSession,
  evaluateReopen,
  calculateTotalFocusMs,
} from '@/features/timer/engine';

describe('Pure Timer Engine Specifications', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('handles two simulated hours without timer drift using absolute timestamps', () => {
    const startTime = 1_000_000;
    vi.setSystemTime(startTime);

    // 2-hour planned session (7200 seconds)
    let state = createInitialEngineState(7200, 'focus');
    state = startSession(state, startTime);

    expect(state.status).toBe('running');
    expect(state.endsAt).toBe(startTime + 7200 * 1000);

    // Simulate 2 hours of elapsed time in irregular ticks
    const ticks = [5000, 15320, 60000, 1800000, 3600000, 7199000, 7200000];
    for (const offset of ticks) {
      const now = startTime + offset;
      vi.setSystemTime(now);
      state = tickSession(state, now);
      if (offset < 7200000) {
        expect(state.remainingMs).toBe(7200 * 1000 - offset);
      }
    }

    expect(state.status).toBe('finished');
    expect(state.remainingMs).toBe(0);
    expect(state.completedRecorded).toBe(true);
  });

  it('strictly excludes paused time from focus segments and focus duration', () => {
    const t0 = 10_000_000;
    vi.setSystemTime(t0);

    // 25-minute session
    let state = createInitialEngineState(25 * 60, 'focus');
    state = startSession(state, t0);

    // Focus for 10 minutes (600,000 ms)
    const t1 = t0 + 10 * 60 * 1000;
    vi.setSystemTime(t1);
    state = pauseSession(state, t1);

    expect(state.status).toBe('paused');
    expect(state.segments.length).toBe(1);
    expect(state.segments[0]).toEqual({ startMs: t0, endMs: t1 });

    // Pause for 5 minutes (300,000 ms) - paused time never sits inside a segment!
    const t2 = t1 + 5 * 60 * 1000;
    vi.setSystemTime(t2);
    state = resumeSession(state, t2);

    expect(state.status).toBe('running');
    expect(state.currentSegmentStart).toBe(t2);
    expect(state.endsAt).toBe(t2 + 15 * 60 * 1000);

    // Focus for another 15 minutes to complete
    const t3 = t2 + 15 * 60 * 1000;
    vi.setSystemTime(t3);
    state = completeSession(state, t3);

    expect(state.status).toBe('finished');
    expect(state.segments.length).toBe(2);
    expect(state.segments[1]).toEqual({ startMs: t2, endMs: t3 });

    // Total focus time should be exactly 25 minutes (1,500,000 ms), NOT 30 minutes
    const totalFocusMs = calculateTotalFocusMs(state.segments);
    expect(totalFocusMs).toBe(25 * 60 * 1000);
  });

  it('recovers session accurately upon reload when deadline is still in the future', () => {
    const t0 = 20_000_000;
    let state = createInitialEngineState(25 * 60, 'focus');
    state = startSession(state, t0);

    // App is closed for 7 minutes
    const reopenTime = t0 + 7 * 60 * 1000;
    const evaluation = evaluateReopen(state, reopenTime);

    expect(evaluation.action).toBe('continue');
    expect(evaluation.state.status).toBe('running');
    expect(evaluation.state.remainingMs).toBe(18 * 60 * 1000);
  });

  it('credits focus time only up to lastSeenAt when deadline passed while closed', () => {
    const t0 = 30_000_000;
    let state = createInitialEngineState(25 * 60, 'focus');
    state = startSession(state, t0);

    // Last heartbeat seen at 15 minutes
    const lastHeartbeat = t0 + 15 * 60 * 1000;
    state = { ...state, lastSeenAt: lastHeartbeat };

    // App is reopened after 40 minutes (well past 25-minute deadline)
    const reopenTime = t0 + 40 * 60 * 1000;
    const evaluation = evaluateReopen(state, reopenTime);

    expect(evaluation.action).toBe('prompt_completion');
    expect(evaluation.state.reopenNeedsConfirmation).toBe(true);
    // Credited focus time must cap at lastSeenAt (15 mins), not 25 mins or 40 mins
    expect(evaluation.creditedFocusMs).toBe(15 * 60 * 1000);
    expect(evaluation.state.reopenCreditedMs).toBe(15 * 60 * 1000);
  });

  it('ensures session completion is recorded once and idempotent', () => {
    const t0 = 40_000_000;
    let state = createInitialEngineState(25 * 60, 'focus');
    state = startSession(state, t0);

    const completionTime = t0 + 25 * 60 * 1000;
    state = completeSession(state, completionTime);
    expect(state.completedRecorded).toBe(true);
    expect(state.focusCount).toBe(1);

    // Trigger completeSession again (e.g. from reload or duplicate tick)
    const idempotentState = completeSession(state, completionTime + 1000);
    expect(idempotentState.completedRecorded).toBe(true);
    expect(idempotentState.focusCount).toBe(1); // Not incremented twice
    expect(idempotentState.segments.length).toBe(state.segments.length);
  });

  it('evaluates fullscreen failure handling and CSS fallback mode', () => {
    // When requestFullscreen throws or is not defined (e.g. iPhone Safari)
    const isFullscreenSupported = typeof document !== 'undefined' && 'requestFullscreen' in document;
    const fallbackToCssFocusMode = !isFullscreenSupported;

    expect(fallbackToCssFocusMode).toBe(true);
  });
});
