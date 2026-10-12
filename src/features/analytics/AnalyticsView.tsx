import { EmptyState } from '@/app/EmptyState';

export function AnalyticsView() {
  return (
    <main role="main" className="view-container">
      <header className="view-header">
        <h1 className="view-title">Analytics</h1>
        <p className="view-subtitle">Recorded focus time and goal achievement metrics.</p>
      </header>
      <EmptyState
        sentence="Not enough data yet. Under three days of data."
        actionLabel="Record focus session"
        actionHref="#/timer"
      />
    </main>
  );
}
