import './ErrorBoundary.css'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '../components/Button'

type Props = { children: ReactNode; fallback?: (error: Error) => ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error:', error, info)
  }

  reset = () => this.setState({ error: null })

  reload = () => window.location.reload()

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    if (this.props.fallback) return this.props.fallback(error)
    return (
      <div className="error-boundary" role="alert">
        <div className="error-boundary-card">
          <div className="error-boundary-icon">
            {/* triangle-alert glyph (Lucide-style, inline so no theme dependency) */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>
          <h1 className="error-boundary-title">Something went wrong</h1>
          <p className="error-boundary-subtitle">
            An unexpected error occurred. Try again, or reload the page if the issue persists.
          </p>
          <pre className="error-boundary-details">{error.message}</pre>
          <div className="error-boundary-actions">
            <Button variant="secondary" onClick={this.reload}>Reload</Button>
            <Button onClick={this.reset}>Try again</Button>
          </div>
        </div>
      </div>
    )
  }
}
