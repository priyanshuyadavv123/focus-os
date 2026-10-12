import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error:', error, errorInfo);
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main
          role="alert"
          style={{
            padding: 'var(--space-24)',
            maxWidth: 'var(--content-max-width)',
            margin: '0 auto',
            color: 'var(--text)',
          }}
        >
          <h1 style={{ fontSize: 'var(--font-size-28)', marginBottom: 'var(--space-16)' }}>
            Something went wrong
          </h1>
          <p style={{ color: 'var(--text-2)', marginBottom: 'var(--space-24)' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: 'var(--space-8) var(--space-16)',
              borderRadius: 'var(--radius-control)',
              backgroundColor: 'var(--accent)',
              color: 'var(--bg)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Reload FOCUS OS
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
