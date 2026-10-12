
export interface EmptyStateProps {
  sentence: string;
  actionLabel: string;
  onAction?: () => void;
  actionHref?: string;
}

export function EmptyState({ sentence, actionLabel, onAction, actionHref }: EmptyStateProps) {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'var(--space-48) var(--space-24)',
        gap: 'var(--space-16)',
        marginTop: 'var(--space-24)',
      }}
    >
      <p style={{ color: 'var(--text-2)', fontSize: 'var(--font-size-14)' }}>{sentence}</p>
      {actionHref ? (
        <a href={actionHref} className="btn-primary" role="button">
          {actionLabel}
        </a>
      ) : (
        <button type="button" onClick={onAction} className="btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
