import React from 'react';

/**
 * ErrorBoundary — catches rendering errors and shows a fallback UI
 * instead of crashing the entire app with a white screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FAFAFA',
          fontFamily: "'Inter', sans-serif",
          padding: '24px',
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            padding: '48px 40px',
            textAlign: 'center',
          }}>
            <div style={{
              width: '64px', height: '64px',
              borderRadius: '16px',
              background: '#FEF2F2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '28px',
            }}>⚠️</div>

            <h1 style={{
              fontSize: '22px', fontWeight: '800',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: '#111827', marginBottom: '8px',
            }}>Terjadi Kesalahan</h1>

            <p style={{
              fontSize: '14px', color: '#6B7280',
              lineHeight: '1.6', marginBottom: '32px',
            }}>
              Maaf, halaman ini mengalami error tak terduga.
              Silakan muat ulang atau kembali ke beranda.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre style={{
                background: '#F9FAFB', border: '1px solid #E5E7EB',
                borderRadius: '8px', padding: '12px 16px',
                fontSize: '12px', color: '#EF4444',
                textAlign: 'left', marginBottom: '24px',
                overflow: 'auto', maxHeight: '120px',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {this.state.error.message}
              </pre>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={this.handleReload} style={{
                padding: '10px 24px', borderRadius: '8px',
                background: '#3B82F6', color: '#FFFFFF',
                border: 'none', fontWeight: '600', fontSize: '14px',
                cursor: 'pointer',
              }}>Muat Ulang</button>

              <button onClick={this.handleGoHome} style={{
                padding: '10px 24px', borderRadius: '8px',
                background: '#FFFFFF', color: '#6B7280',
                border: '1px solid #E5E7EB', fontWeight: '600', fontSize: '14px',
                cursor: 'pointer',
              }}>Beranda</button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
