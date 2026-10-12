import { EmptyState } from '@/app/EmptyState';

export function ResearchView() {
  return (
    <main role="main" className="view-container">
      <header className="view-header">
        <h1 className="view-title">Research Lab</h1>
        <p className="view-subtitle">Hypotheses, reproducible methods, and observed findings.</p>
      </header>
      <EmptyState
        sentence="No research experiments recorded."
        actionLabel="Add research note"
        onAction={() => {}}
      />
    </main>
  );
}
