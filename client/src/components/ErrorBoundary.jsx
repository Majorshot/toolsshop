import React from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);

    // Auto-detect stale chunk loading failure after new deployment
    const errorString = (error?.message || error?.toString() || '').toLowerCase();
    const isChunkLoadFailed =
      errorString.includes('dynamically imported module') ||
      errorString.includes('loading chunk') ||
      errorString.includes('failed to fetch') ||
      errorString.includes('mime type') ||
      errorString.includes('syntaxerror');

    if (isChunkLoadFailed) {
      const reloadKey = 'vpt_auto_chunk_reload';
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();

      // Only auto-reload if we haven't done so in the last 10 seconds (prevents reload loop)
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem(reloadKey, String(now));
        console.warn('Detected stale chunk after deployment. Auto-reloading page to fetch latest build...');
        window.location.reload();
      }
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || 'Unknown application error';
      const isChunkError =
        errorMsg.toLowerCase().includes('dynamically imported module') ||
        errorMsg.toLowerCase().includes('loading chunk');

      return (
        <div
          style={{
            minHeight: '65vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 16px',
            background: 'var(--bg-primary, #f8fafc)'
          }}
          role="alert"
          aria-live="assertive"
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              background: '#ffffff',
              borderRadius: '16px',
              padding: '32px 24px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}
          >
            {/* Warning / Update Icon */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: isChunkError ? '#eff6ff' : '#fef2f2',
                color: isChunkError ? '#2563eb' : '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                border: `2px solid ${isChunkError ? '#bfdbfe' : '#fecaca'}`
              }}
            >
              {isChunkError ? <RefreshCw size={28} /> : <AlertTriangle size={28} />}
            </div>

            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: '800',
                color: '#0f172a',
                marginBottom: '8px',
                lineHeight: 1.3
              }}
            >
              {isChunkError ? 'New App Version Available' : 'Something Went Wrong'}
            </h2>

            <p
              style={{
                fontSize: '0.92rem',
                color: '#64748b',
                lineHeight: 1.55,
                marginBottom: '24px'
              }}
            >
              {isChunkError
                ? 'A recent update was deployed while your browser tab was open. Refreshing will load the latest version instantly.'
                : 'The page ran into an unexpected issue. Refreshing the page or returning home usually fixes this immediately.'}
            </p>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginBottom: '20px'
              }}
            >
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 22px',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                  transition: 'opacity 0.2s ease'
                }}
                id="btn-error-refresh"
              >
                <RefreshCw size={16} />
                <span>Refresh Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '12px 20px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                id="btn-error-home"
              >
                <Home size={16} />
                <span>Go to Home</span>
              </button>
            </div>

            {/* Expandable Technical Info for Debugging */}
            <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
              <button
                type="button"
                onClick={this.toggleDetails}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px'
                }}
              >
                <span>{this.state.showDetails ? 'Hide Technical Details' : 'Show Technical Details'}</span>
                {this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {this.state.showDetails && (
                <div
                  style={{
                    marginTop: '10px',
                    textAlign: 'left',
                    background: '#f8fafc',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    color: '#475569',
                    maxHeight: '140px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  <strong>Error:</strong> {errorMsg}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      <br /><br />
                      <strong>Component Stack:</strong>
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
