import React from 'react'
import { colors } from '../theme/colors.js'

/**
 * ErrorBoundary — Catches React rendering errors and displays a fallback UI
 * 
 * @component
 * @example
 * <ErrorBoundary name="GameView">
 *   <PhaserGame />
 * </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  /**
   * @param {Object} props
   * @param {React.ReactNode} props.children - Components to render
   * @param {string} [props.name] - Optional name for error reporting
   */
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
    }
  }

  /**
   * Update state when error is caught
   * @param {Error} error - The error that was thrown
   * @returns {Object} New state
   */
  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  /**
   * Log error details to console in development
   * @param {Error} error - The error object
   * @param {Object} errorInfo - React error info (componentStack, etc.)
   */
  componentDidCatch(error, errorInfo) {
    console.error('❌ [ErrorBoundary] Caught error:', error)
    console.group('Error Stack')
    console.error(errorInfo.componentStack)
    console.groupEnd()

    this.setState({
      error,
      errorInfo,
    })
  }

  render() {
    if (this.state.hasError) {
      const name = this.props.name || 'Component'
      const isDev = import.meta.env.DEV

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            padding: '20px',
            background: colors.bg || '#1a1a2e',
            color: colors.textPrimary || '#e0e0e0',
            fontFamily: 'monospace',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h2 style={{ fontSize: '24px', margin: '0 0 10px 0', color: '#ff6b6b' }}>
              ⚠️ {name} Error
            </h2>
            <p style={{ fontSize: '14px', margin: '10px 0', lineHeight: '1.6', color: colors.textSecondary || '#a0a0a0' }}>
              Something went wrong. Please check the console and try refreshing.
            </p>

            {isDev && this.state.error && (
              <details
                style={{
                  marginTop: '20px',
                  padding: '10px',
                  background: 'rgba(255, 107, 107, 0.1)',
                  border: '1px solid rgba(255, 107, 107, 0.3)',
                  borderRadius: '4px',
                  textAlign: 'left',
                  fontSize: '12px',
                  maxHeight: '200px',
                  overflow: 'auto',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: '10px' }}>
                  Dev: Show Error Details
                </summary>
                <pre style={{ margin: '0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <pre style={{ margin: '10px 0 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '11px' }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                background: colors.primary || '#00d4a4',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
              }}
              onMouseOver={(e) => {
                e.target.style.opacity = '0.8'
              }}
              onMouseOut={(e) => {
                e.target.style.opacity = '1'
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
