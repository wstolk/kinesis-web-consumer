import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    padding: '2rem',
                    fontFamily: 'Roboto, sans-serif',
                    color: '#8b90a0',
                    backgroundColor: '#0f1117',
                }}>
                    <h2 style={{ color: '#e1e4ed', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Something went wrong
                    </h2>
                    <p style={{ fontSize: '0.8rem', marginBottom: '1rem', maxWidth: 500, textAlign: 'center' }}>
                        An unexpected error occurred. Try reloading the page.
                    </p>
                    {this.state.error && (
                        <pre style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: '0.7rem',
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 4,
                            padding: '0.75rem 1rem',
                            maxWidth: 500,
                            overflow: 'auto',
                            marginBottom: '1rem',
                            color: '#ef4444',
                        }}>
                            {this.state.error.message}
                        </pre>
                    )}
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            padding: '6px 16px',
                            borderRadius: 4,
                            border: '1px solid #3b82c4',
                            backgroundColor: 'transparent',
                            color: '#3b82c4',
                            cursor: 'pointer',
                        }}
                    >
                        Reload
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
