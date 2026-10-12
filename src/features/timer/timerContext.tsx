import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import {
  EngineState,
  createInitialEngineState,
  startSession,
  tickSession,
  pauseSession,
  resumeSession,
  endSessionEarly,
  completeSession,
  restartSession,
  evaluateReopen,
  getNextSessionKind,
  SessionKind,
} from './engine';
import { loadData, saveData, FocusSession } from '@/lib/storage';
import { playChime } from './sound';

interface TimerContextValue {
  state: EngineState;
  soundOn: boolean;
  setSoundOn: (on: boolean) => void;
  start: (
    seconds?: number,
    kind?: SessionKind,
    taskId?: string | null,
    taskTitle?: string
  ) => void;
  pause: () => void;
  resume: () => void;
  end: () => void;
  restart: () => void;
  skipToBreak: () => void;
  confirmReopen: (markAsCompleted: boolean) => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

const ACTIVE_SESSION_STORAGE_KEY = 'focus_os_active_session';

export function TimerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EngineState>(() => {
    // Attempt recovery from storage
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as EngineState;
          const evaluation = evaluateReopen(parsed, Date.now());
          return evaluation.state;
        }
      } catch (e) {
        console.warn('Could not restore session:', e);
      }
    }
    return createInitialEngineState(25 * 60, 'focus');
  });

  const [soundOn, setSoundOn] = useState<boolean>(() => {
    const { data } = loadData();
    return data.settings.soundOn;
  });

  // Track state ref for tick interval and listeners
  const stateRef = useRef(state);
  stateRef.current = state;

  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;

  // Single tick source & heartbeat
  useEffect(() => {
    let tickInterval: NodeJS.Timeout | null = null;
    let heartbeatInterval: NodeJS.Timeout | null = null;

    if (state.status === 'running') {
      // 1-second display tick
      tickInterval = setInterval(() => {
        const now = Date.now();
        const next = tickSession(stateRef.current, now);
        setState(next);

        if (next.status === 'finished') {
          if (soundOnRef.current) {
            playChime();
          }
          // Save completed session to persistent records
          recordSessionToStorage(next, 'completed');
          window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
        }
      }, 1000);

      // 5-second storage heartbeat
      heartbeatInterval = setInterval(() => {
        const now = Date.now();
        const updated = { ...stateRef.current, lastSeenAt: now };
        window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(updated));
      }, 5000);
    }

    return () => {
      if (tickInterval) clearInterval(tickInterval);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [state.status]);

  // Recalculate on visibilitychange (prevent background tab timer throttling issues)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && stateRef.current.status === 'running') {
        const now = Date.now();
        const next = tickSession(stateRef.current, now);
        setState(next);
        if (next.status === 'finished') {
          if (soundOnRef.current) {
            playChime();
          }
          recordSessionToStorage(next, 'completed');
          window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Save active session state to localStorage on state changes
  useEffect(() => {
    if (state.status === 'running' || state.status === 'paused') {
      window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(state));
    } else if (state.status === 'idle') {
      window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    }
  }, [state]);

  const start = (
    seconds?: number,
    kind?: SessionKind,
    taskId?: string | null,
    taskTitle?: string
  ) => {
    const now = Date.now();
    const next = startSession(stateRef.current, now, seconds, kind, taskId, taskTitle);
    setState(next);
    window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(next));
  };

  const pause = () => {
    const now = Date.now();
    const next = pauseSession(stateRef.current, now);
    setState(next);
    window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(next));
  };

  const resume = () => {
    const now = Date.now();
    const next = resumeSession(stateRef.current, now);
    setState(next);
    window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(next));
  };

  const end = () => {
    const now = Date.now();
    const next = endSessionEarly(stateRef.current, now);
    setState(next);
    recordSessionToStorage(next, 'ended_early');
    window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
  };

  const restart = () => {
    const now = Date.now();
    const next = restartSession(stateRef.current, now);
    setState(next);
    window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(next));
  };

  const skipToBreak = () => {
    const now = Date.now();
    const s = stateRef.current;
    const isCompleted = s.remainingMs === 0;
    const finishedState = isCompleted ? completeSession(s, now) : endSessionEarly(s, now);
    recordSessionToStorage(finishedState, isCompleted ? 'completed' : 'ended_early');

    const nextKind = getNextSessionKind(s.kind, s.focusCount);
    const breakSeconds = nextKind === 'longBreak' ? 15 * 60 : 5 * 60;
    const breakState = startSession(finishedState, now, breakSeconds, nextKind);
    setState(breakState);
    window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(breakState));
  };

  const confirmReopen = (markAsCompleted: boolean) => {
    const s = stateRef.current;
    const finalStatus = markAsCompleted ? 'completed' : 'interrupted';
    recordSessionToStorage(s, finalStatus);
    window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    setState(createInitialEngineState(25 * 60, 'focus'));
  };

  return (
    <TimerContext.Provider
      value={{
        state,
        soundOn,
        setSoundOn,
        start,
        pause,
        resume,
        end,
        restart,
        skipToBreak,
        confirmReopen,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

function recordSessionToStorage(
  engineState: EngineState,
  finalStatus: 'completed' | 'ended_early' | 'interrupted' | 'restarted'
) {
  const { data } = loadData();
  const sessionRecord: FocusSession = {
    id: engineState.sessionId,
    taskId: engineState.taskId || undefined,
    kind: engineState.kind,
    plannedSeconds: engineState.plannedSeconds,
    segments: engineState.segments,
    status: finalStatus,
    lastSeenAt: engineState.lastSeenAt,
    completedAt: finalStatus === 'completed' ? Date.now() : undefined,
  };

  // Add only if not already recorded
  const exists = data.sessions.some((s) => s.id === sessionRecord.id);
  if (!exists) {
    data.sessions.push(sessionRecord);
    saveData(data);
  }
}

export function useTimer(): TimerContextValue {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}
