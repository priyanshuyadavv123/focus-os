import { EmptyState } from '@/app/EmptyState';

export function RevenueView() {
  return (
    <main role="main" className="view-container">
      <header className="view-header">
        <h1 className="view-title">Revenue Lab</h1>
        <p className="view-subtitle">Prospect pipeline and validated problem evidence.</p>
      </header>
      <EmptyState
        sentence="No active prospects in pipeline."
        actionLabel="Add prospect"
        onAction={() => {}}
      />
    </main>
  );
}
