import { EmptyState } from '@/app/EmptyState';

export function TimerView() {
  return (
    <main role="main" className="view-container">
      <header className="view-header">
        <h1 className="view-title">Focus Timer</h1>
        <p className="view-subtitle">Single-task instrument with timestamp recovery.</p>
      </header>
      <EmptyState
        sentence="No active timer session running."
        actionLabel="Start 25-minute focus"
        onAction={() => {}}
      />
    </main>
  );
}
