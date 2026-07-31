import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary: catches render errors, shows recovery UI instead of blank screen.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: '400px',
            gap: '16px',
            padding: '40px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '48px' }}>😵</span>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '400px' }}>
            An unexpected error occurred. You can try reloading the page.
          </p>
          {this.state.error && (
            <pre
              style={{
                fontSize: '11px',
                color: 'var(--error)',
                background: 'var(--bg-secondary)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                maxWidth: '500px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReload}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
            }}
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
