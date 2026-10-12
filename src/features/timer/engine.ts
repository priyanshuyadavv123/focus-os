/**
 * FOCUS OS - Pure Timer Engine
 * Must NOT import React.
 * Uses timestamps rather than decrementing counters to prevent drift.
 */

export type SessionKind = 'focus' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface TimerSegment {
  startMs: number;
  endMs: number;
}

export interface EngineState {
  sessionId: string;
  taskId: string | null;
  taskTitle: string;
  kind: SessionKind;
  status: TimerStatus;
  plannedSeconds: number;
  endsAt: number | null; // Milliseconds timestamp while running
  remainingMs: number;
  lastSeenAt: number;
  segments: TimerSegment[];
  currentSegmentStart: number | null;
  completedRecorded: boolean;
  focusCount: number; // completed focus sessions count
  reopenNeedsConfirmation: boolean;
  reopenCreditedMs: number;
}

export interface ReopenEvaluation {
  action: 'none' | 'continue' | 'prompt_completion';
  state: EngineState;
  creditedFocusMs: number;
}

export function createInitialEngineState(
  plannedSeconds: number = 25 * 60,
  kind: SessionKind = 'focus'
): EngineState {
  return {
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    taskId: null,
    taskTitle: 'Deep Work Session',
    kind,
    status: 'idle',
    plannedSeconds,
    endsAt: null,
    remainingMs: plannedSeconds * 1000,
    lastSeenAt: Date.now(),
    segments: [],
    currentSegmentStart: null,
    completedRecorded: false,
    focusCount: 0,
    reopenNeedsConfirmation: false,
    reopenCreditedMs: 0,
  };
}

export function startSession(
  state: EngineState,
  now: number,
  plannedSeconds?: number,
  kind?: SessionKind
): EngineState {
  const finalSeconds = plannedSeconds ?? state.plannedSeconds;
  const finalKind = kind ?? state.kind;
  const remaining = finalSeconds * 1000;

  return {
    ...state,
    sessionId: `session_${now}_${Math.random().toString(36).substring(2, 7)}`,
    kind: finalKind,
    status: 'running',
    plannedSeconds: finalSeconds,
    endsAt: now + remaining,
    remainingMs: remaining,
    lastSeenAt: now,
    segments: [],
    currentSegmentStart: finalKind === 'focus' ? now : null,
    completedRecorded: false,
    reopenNeedsConfirmation: false,
    reopenCreditedMs: 0,
  };
}

export function tickSession(state: EngineState, now: number): EngineState {
  if (state.status !== 'running' || state.endsAt === null) {
    return { ...state, lastSeenAt: now };
  }

  const remaining = Math.max(0, state.endsAt - now);

  if (remaining === 0) {
    // Session reached zero
    return completeSession(state, now);
  }

  return {
    ...state,
    remainingMs: remaining,
    lastSeenAt: now,
  };
}

export function pauseSession(state: EngineState, now: number): EngineState {
  if (state.status !== 'running' || state.endsAt === null) {
    return state;
  }

  const remaining = Math.max(0, state.endsAt - now);
  const updatedSegments = [...state.segments];

  if (state.kind === 'focus' && state.currentSegmentStart !== null) {
    updatedSegments.push({
      startMs: state.currentSegmentStart,
      endMs: now,
    });
  }

  return {
    ...state,
    status: 'paused',
    endsAt: null,
    remainingMs: remaining,
    lastSeenAt: now,
    segments: updatedSegments,
    currentSegmentStart: null,
  };
}

export function resumeSession(state: EngineState, now: number): EngineState {
  if (state.status !== 'paused') {
    return state;
  }

  return {
    ...state,
    status: 'running',
    endsAt: now + state.remainingMs,
    lastSeenAt: now,
    currentSegmentStart: state.kind === 'focus' ? now : null,
  };
}

export function completeSession(state: EngineState, now: number): EngineState {
  if (state.completedRecorded && state.status === 'finished') {
    return state; // Idempotent
  }

  const updatedSegments = [...state.segments];
  if (state.kind === 'focus' && state.currentSegmentStart !== null) {
    updatedSegments.push({
      startMs: state.currentSegmentStart,
      endMs: now,
    });
  }

  const nextFocusCount = state.kind === 'focus' ? state.focusCount + 1 : state.focusCount;

  return {
    ...state,
    status: 'finished',
    endsAt: null,
    remainingMs: 0,
    lastSeenAt: now,
    segments: updatedSegments,
    currentSegmentStart: null,
    completedRecorded: true,
    focusCount: nextFocusCount,
  };
}

export function endSessionEarly(state: EngineState, now: number): EngineState {
  const updatedSegments = [...state.segments];
  if (state.kind === 'focus' && state.currentSegmentStart !== null) {
    updatedSegments.push({
      startMs: state.currentSegmentStart,
      endMs: now,
    });
  }

  return {
    ...state,
    status: 'finished',
    endsAt: null,
    remainingMs: 0,
    lastSeenAt: now,
    segments: updatedSegments,
    currentSegmentStart: null,
    completedRecorded: false,
  };
}

export function restartSession(state: EngineState, now: number): EngineState {
  return startSession(state, now, state.plannedSeconds, state.kind);
}

export function evaluateReopen(state: EngineState, now: number): ReopenEvaluation {
  if (state.status !== 'running' || state.endsAt === null) {
    return { action: 'none', state, creditedFocusMs: 0 };
  }

  if (state.endsAt > now) {
    // Deadline is still in the future: resume normally with updated remainingMs
    const remaining = state.endsAt - now;
    return {
      action: 'continue',
      state: {
        ...state,
        remainingMs: remaining,
        lastSeenAt: now,
      },
      creditedFocusMs: 0,
    };
  }

  // Deadline passed while app was closed!
  // Credit focus time ONLY up to lastSeenAt. Status stays interrupted unless confirmed.
  const cappedEnd = Math.min(state.endsAt, state.lastSeenAt);
  const updatedSegments = [...state.segments];
  let additionalFocusMs = 0;

  if (state.kind === 'focus' && state.currentSegmentStart !== null) {
    const endMs = Math.max(state.currentSegmentStart, cappedEnd);
    updatedSegments.push({
      startMs: state.currentSegmentStart,
      endMs,
    });
    additionalFocusMs = endMs - state.currentSegmentStart;
  }

  const creditedMs = calculateTotalFocusMs(updatedSegments);

  return {
    action: 'prompt_completion',
    state: {
      ...state,
      status: 'paused',
      endsAt: null,
      remainingMs: 0,
      segments: updatedSegments,
      currentSegmentStart: null,
      reopenNeedsConfirmation: true,
      reopenCreditedMs: creditedMs,
    },
    creditedFocusMs: additionalFocusMs,
  };
}

export function calculateTotalFocusMs(segments: TimerSegment[]): number {
  return segments.reduce((sum, seg) => {
    return sum + Math.max(0, seg.endMs - seg.startMs);
  }, 0);
}

export function getNextSessionKind(
  currentKind: SessionKind,
  focusCount: number,
  longBreakEvery: number = 4
): SessionKind {
  if (currentKind !== 'focus') {
    return 'focus';
  }
  return focusCount % longBreakEvery === 0 ? 'longBreak' : 'shortBreak';
}
