import { useTimer } from './timerContext';

export function MiniTimerBar({ currentRoute }: { currentRoute?: string }) {
  const { state, pause, resume } = useTimer();

  // Mini timer appears only on other pages while a session runs or is paused
  if (currentRoute === 'timer') {
    return null;
  }

  if (typeof window !== 'undefined' && window.location.hash.toLowerCase() === '#/timer') {
    return null;
  }

  if (state.status !== 'running' && state.status !== 'paused') {
    return null;
  }

  const remainingSeconds = Math.ceil(state.remainingMs / 1000);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const kindLabel =
    state.kind === 'focus' ? 'FOCUS' : state.kind === 'shortBreak' ? 'SHORT BREAK' : 'LONG BREAK';

  return (
    <aside
      aria-label="Active session banner"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 35,
        backgroundColor: 'var(--surface-2)',
        borderBottom: '1px solid var(--border-strong)',
        padding: 'var(--space-8) var(--space-24)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 'var(--font-size-14)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-12)' }}>
        <span
          style={{
            fontSize: 'var(--font-size-12)',
            color: 'var(--accent)',
            fontWeight: 600,
            letterSpacing: '0.08em',
          }}
        >
          {kindLabel}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--text)',
          }}
        >
          {formattedTime}
        </span>
        <span style={{ color: 'var(--text-3)', fontSize: 'var(--font-size-12)' }}>
          ({state.status === 'paused' ? 'Paused' : 'Running'})
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
        {state.status === 'running' ? (
          <button
            type="button"
            onClick={pause}
            className="btn-secondary"
            style={{ minHeight: '32px', padding: '2px 10px', fontSize: 'var(--font-size-12)' }}
          >
            Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={resume}
            className="btn-primary"
            style={{ minHeight: '32px', padding: '2px 10px', fontSize: 'var(--font-size-12)' }}
          >
            Resume
          </button>
        )}
        <a
          href="#/timer"
          className="btn-ghost"
          style={{ minHeight: '32px', padding: '2px 10px', fontSize: 'var(--font-size-12)' }}
        >
          Open Timer
        </a>
      </div>
    </aside>
  );
}
