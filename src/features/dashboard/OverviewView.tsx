import { EmptyState } from '@/app/EmptyState';

export function OverviewView() {
  return (
    <main role="main" className="view-container">
      <header className="view-header">
        <h1 className="view-title">Overview</h1>
        <p className="view-subtitle">Today's focus budget and planned priority tasks.</p>
      </header>
      <EmptyState
        sentence="No tasks scheduled for today."
        actionLabel="Start focus session"
        actionHref="#/timer"
      />
    </main>
  );
}
