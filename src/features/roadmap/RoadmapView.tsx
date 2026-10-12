import { EmptyState } from '@/app/EmptyState';

export function RoadmapView() {
  return (
    <main role="main" className="view-container">
      <header className="view-header">
        <h1 className="view-title">Learning Roadmap</h1>
        <p className="view-subtitle">Four-year curriculum milestones and completion criteria.</p>
      </header>
      <EmptyState
        sentence="Roadmap milestones ready to track."
        actionLabel="View semester 1"
        onAction={() => {}}
      />
    </main>
  );
}
