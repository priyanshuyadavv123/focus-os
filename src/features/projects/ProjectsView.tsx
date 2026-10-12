import { EmptyState } from '@/app/EmptyState';

export function ProjectsView() {
  return (
    <main role="main" className="view-container">
      <header className="view-header">
        <h1 className="view-title">Projects</h1>
        <p className="view-subtitle">Project records and Hermes improvement board.</p>
      </header>
      <EmptyState
        sentence="No active projects recorded."
        actionLabel="Create project"
        onAction={() => {}}
      />
    </main>
  );
}
