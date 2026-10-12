import { EmptyState } from '@/app/EmptyState';

export function SettingsView() {
  return (
    <main role="main" className="view-container">
      <header className="view-header">
        <h1 className="view-title">Settings</h1>
        <p className="view-subtitle">Local configuration, display preferences, and data backup.</p>
      </header>
      <EmptyState
        sentence="Default configuration active. 180-minute daily budget."
        actionLabel="Export backup"
        onAction={() => {}}
      />
    </main>
  );
}
