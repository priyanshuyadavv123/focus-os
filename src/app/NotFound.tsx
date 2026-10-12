
export function NotFound() {
  return (
    <main
      role="main"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        gap: 'var(--space-16)',
        padding: 'var(--space-24)',
      }}
    >
      <h1
        style={{
          fontSize: 'var(--font-size-28)',
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.02em',
        }}
      >
        Page not found
      </h1>
      <p style={{ color: 'var(--text-2)', fontSize: 'var(--font-size-14)' }}>
        The requested route does not exist in FOCUS OS.
      </p>
      <a href="#/overview" className="btn-primary" role="button">
        Return to overview
      </a>
    </main>
  );
}
