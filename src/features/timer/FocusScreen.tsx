import { useState, useEffect, useRef } from 'react';
import { useTimer } from './timerContext';

interface FocusScreenProps {
  onExitFocusView?: () => void;
}

export function FocusScreen({ onExitFocusView }: FocusScreenProps) {
  const { state, soundOn, setSoundOn, pause, resume, end, restart, skipToBreak } = useTimer();
  const [confirmModal, setConfirmModal] = useState<'end' | 'restart' | null>(null);
  const [cssFullscreen, setCssFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Time calculations
  const totalSeconds = state.plannedSeconds;
  const remainingSeconds = Math.ceil(state.remainingMs / 1000);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressFraction = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;
  const circumference = 2 * Math.PI * 120; // Radius 120
  const strokeDashoffset = circumference * (1 - progressFraction);

  // Keyboard controls: Space (pause/resume), E (end confirm), Escape (exit view only)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (state.status === 'running') {
          pause();
        } else if (state.status === 'paused') {
          resume();
        }
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        setConfirmModal('end');
      } else if (e.key === 'Escape') {
        // Native Escape handled by browser for fullscreen; in-app escape exits view only
        if (cssFullscreen) {
          setCssFullscreen(false);
        } else if (onExitFocusView) {
          onExitFocusView();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.status, cssFullscreen, onExitFocusView, pause, resume]);

  // Fullscreen toggle with fallback to CSS mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement && !cssFullscreen) {
      if (containerRef.current && containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {
          // Refused or unsupported (e.g. iOS Safari) -> fallback to CSS focus mode
          setCssFullscreen(true);
        });
      } else {
        setCssFullscreen(true);
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setCssFullscreen(false);
    }
  };

  const kindLabel =
    state.kind === 'focus' ? 'FOCUS' : state.kind === 'shortBreak' ? 'SHORT BREAK' : 'LONG BREAK';

  return (
    <div
      ref={containerRef}
      className={`focus-screen-container ${cssFullscreen ? 'css-fullscreen' : ''}`}
      style={{
        position: cssFullscreen ? 'fixed' : 'relative',
        inset: cssFullscreen ? 0 : undefined,
        height: cssFullscreen ? '100dvh' : 'auto',
        minHeight: cssFullscreen ? '100dvh' : '520px',
        backgroundColor: '#000000',
        zIndex: cssFullscreen ? 100 : 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-32) var(--space-24)',
        boxShadow: 'inset 0 0 160px rgba(140, 132, 245, 0.08)',
        borderRadius: cssFullscreen ? 0 : 'var(--radius-card)',
        border: cssFullscreen ? 'none' : '1px solid var(--border)',
      }}
    >
      {/* Task title & kind status */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-24)' }}>
        <p
          style={{
            fontSize: 'var(--font-size-12)',
            letterSpacing: '0.12em',
            color: 'var(--accent)',
            fontWeight: 600,
            marginBottom: 'var(--space-8)',
          }}
          aria-live="polite"
        >
          {kindLabel}
        </p>
        <h2
          style={{
            fontSize: 'var(--font-size-20)',
            fontFamily: 'var(--font-display)',
            color: 'var(--text)',
            fontWeight: 500,
          }}
        >
          {state.taskTitle}
        </h2>
        <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)', marginTop: '4px' }}>
          Session {state.focusCount + 1}
        </p>
      </div>

      {/* Timer display & progress ring */}
      <div
        style={{
          position: 'relative',
          width: '280px',
          height: '280px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="280"
          height="280"
          viewBox="0 0 280 280"
          style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
          aria-hidden="true"
        >
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="transparent"
            stroke="var(--surface-2)"
            strokeWidth="4"
          />
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="transparent"
            stroke="var(--accent)"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>

        <div style={{ textAlign: 'center', zIndex: 2 }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(56px, 15vw, 84px)',
              fontWeight: 200,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
              color: 'var(--text)',
            }}
            aria-label={`${minutes} minutes ${seconds} seconds remaining`}
          >
            {formattedTime}
          </span>
          <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
            {state.status === 'paused' ? 'Paused' : 'Running'}
          </p>
        </div>
      </div>

      {/* Primary bottom controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-12)',
          marginTop: 'var(--space-32)',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {state.status === 'running' ? (
          <button type="button" onClick={pause} className="btn-primary">
            Pause
          </button>
        ) : (
          <button type="button" onClick={resume} className="btn-primary">
            Resume
          </button>
        )}

        <button
          type="button"
          onClick={() => setConfirmModal('end')}
          className="btn-secondary"
        >
          End
        </button>

        <button
          type="button"
          onClick={() => setConfirmModal('restart')}
          className="btn-secondary"
        >
          Restart
        </button>

        <button
          type="button"
          onClick={skipToBreak}
          className="btn-secondary"
          aria-label="Skip to break"
        >
          Skip to Break
        </button>

        <button
          type="button"
          onClick={() => setSoundOn(!soundOn)}
          className="btn-secondary"
          aria-label={`Sound ${soundOn ? 'On' : 'Off'}`}
        >
          Sound: {soundOn ? 'On' : 'Off'}
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          className="btn-secondary"
          aria-label="Toggle fullscreen"
        >
          Fullscreen
        </button>
      </div>

      {/* Confirmation Modals */}
      {confirmModal && (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
          }}
          onClick={() => setConfirmModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="card"
            style={{ maxWidth: '400px', width: '90%', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="confirm-title" style={{ fontSize: 'var(--font-size-20)', marginBottom: 'var(--space-12)' }}>
              {confirmModal === 'end' ? 'End session early?' : 'Restart session?'}
            </h3>
            <p style={{ color: 'var(--text-2)', fontSize: 'var(--font-size-14)', marginBottom: 'var(--space-24)' }}>
              {confirmModal === 'end'
                ? 'Your recorded focus time so far will be saved.'
                : 'The current session progress will reset to the beginning.'}
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-12)', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmModal === 'end') {
                    end();
                  } else {
                    restart();
                  }
                  setConfirmModal(null);
                }}
                className="btn-primary"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
