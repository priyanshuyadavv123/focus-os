import { useState } from 'react';
import { useTimer } from './timerContext';
import { FocusScreen } from './FocusScreen';
import { SessionKind } from './engine';

const PRESETS = [15, 25, 45, 50, 90];

export function TimerView() {
  const { state, start, confirmReopen } = useTimer();
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [customInput, setCustomInput] = useState('');
  const [selectedKind, setSelectedKind] = useState<SessionKind>('focus');

  // If a session is actively running or paused (and not awaiting reopen confirmation), show FocusScreen
  if (!state.reopenNeedsConfirmation && (state.status === 'running' || state.status === 'paused')) {
    return (
      <main role="main" className="view-container">
        <header className="view-header" style={{ marginBottom: 'var(--space-8)' }}>
          <h1 className="view-title">Focus Timer</h1>
        </header>
        <FocusScreen />
      </main>
    );
  }

  const handleStart = () => {
    let finalMinutes = selectedMinutes;
    if (customInput.trim()) {
      const parsed = parseInt(customInput, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 180) {
        finalMinutes = parsed;
      }
    }
    start(finalMinutes * 60, selectedKind);
  };

  return (
    <main role="main" className="view-container">
      <header className="view-header">
        <h1 className="view-title">Focus Timer</h1>
        <p className="view-subtitle">Single-task instrument with timestamp recovery.</p>
      </header>

      {/* Reopen recovery prompt if deadline passed while app was closed */}
      {state.reopenNeedsConfirmation && (
        <div
          role="alert"
          className="card"
          style={{
            borderColor: 'var(--warning)',
            backgroundColor: 'var(--surface-2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
            <span style={{ color: 'var(--warning)', fontWeight: 600 }}>Notice</span>
            <span style={{ color: 'var(--text)' }}>
              This session finished while FOCUS OS was closed. Did you complete it?
            </span>
          </div>
          <p style={{ color: 'var(--text-2)', fontSize: 'var(--font-size-14)' }}>
            Recorded focus time credited up to last recorded heartbeat (
            {Math.round(state.reopenCreditedMs / (1000 * 60))} minutes).
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-12)' }}>
            <button
              type="button"
              onClick={() => confirmReopen(true)}
              className="btn-primary"
            >
              Yes, mark completed
            </button>
            <button
              type="button"
              onClick={() => confirmReopen(false)}
              className="btn-secondary"
            >
              No, keep interrupted
            </button>
          </div>
        </div>
      )}

      {/* Preset & custom selector card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
        <div>
          <label style={{ display: 'block', fontSize: 'var(--font-size-14)', color: 'var(--text-2)', marginBottom: 'var(--space-8)' }}>
            Session Kind
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
            {(['focus', 'shortBreak', 'longBreak'] as SessionKind[]).map((kind) => {
              const label =
                kind === 'focus' ? 'Focus' : kind === 'shortBreak' ? 'Short Break' : 'Long Break';
              const active = selectedKind === kind;
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => {
                    setSelectedKind(kind);
                    if (kind === 'shortBreak') setSelectedMinutes(5);
                    else if (kind === 'longBreak') setSelectedMinutes(15);
                    else setSelectedMinutes(25);
                  }}
                  className={active ? 'btn-primary' : 'btn-secondary'}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--font-size-14)', color: 'var(--text-2)', marginBottom: 'var(--space-8)' }}>
            Duration (Minutes)
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', alignItems: 'center' }}>
            {PRESETS.map((mins) => {
              const active = selectedMinutes === mins && !customInput;
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    setSelectedMinutes(mins);
                    setCustomInput('');
                  }}
                  className={active ? 'btn-primary' : 'btn-secondary'}
                >
                  {mins} min
                </button>
              );
            })}

            <input
              type="number"
              min="1"
              max="180"
              placeholder="Custom (1-180)"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              aria-label="Custom duration in minutes"
              style={{
                width: '130px',
                height: '44px',
                padding: '0 var(--space-12)',
                backgroundColor: 'var(--surface-2)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-control)',
                fontSize: 'var(--font-size-14)',
              }}
            />
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={handleStart}
            className="btn-primary"
            style={{ width: '100%', maxWidth: '240px' }}
          >
            Start Session
          </button>
        </div>
      </div>
    </main>
  );
}
