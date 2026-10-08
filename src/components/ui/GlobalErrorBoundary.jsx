import React from 'react'
import { AlertOctagon, Check, Copy, Home, RefreshCw, ShieldAlert } from 'lucide-react'
import Logo from '../brand/Logo.jsx'
import Button from './Button.jsx'

export class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: false,
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('Unhandled Application Error caught by GlobalErrorBoundary:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  handleCopyDiagnostics = () => {
    const { error, errorInfo } = this.state
    const text = `Lé Inspa Admin Error Log\nTime: ${new Date().toISOString()}\nError: ${error?.message}\nStack: ${error?.stack}\nComponent Stack: ${errorInfo?.componentStack}`
    navigator.clipboard?.writeText(text).then(() => {
      this.setState({ copied: true })
      setTimeout(() => this.setState({ copied: false }), 2500)
    })
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, copied, showDetails } = this.state

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/60 p-4 sm:p-6 lg:p-8 font-sans">
          <div className="w-full max-w-xl rounded-3xl border border-royal-100/80 bg-white p-6 sm:p-10 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="text-center">
              <Logo tone="dark" size="sm" />
              <div className="mx-auto mt-6 flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-200/80">
                <AlertOctagon className="size-7" />
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-royal-950">
                Application Stability Guard
              </h1>
              <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                An unexpected interface exception occurred. The platform prevented data corruption and isolated the error.
              </p>
            </div>

            {/* Error Message Box */}
            <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-left">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="size-4 text-rose-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                    Error Description
                  </p>
                  <p className="mt-1 text-xs text-rose-900 font-mono break-words">
                    {error?.message || 'Unknown runtime exception'}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <Button
                variant="primary"
                fullWidth
                icon={RefreshCw}
                onClick={this.handleReload}
              >
                Reload Dashboard
              </Button>
              <Button
                variant="secondary"
                fullWidth
                icon={Home}
                onClick={this.handleGoHome}
              >
                Return to Command
              </Button>
            </div>

            {/* Technical Diagnostics Accordion */}
            <div className="mt-6 border-t border-gray-100 pt-4 text-center">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <button
                  type="button"
                  onClick={() => this.setState({ showDetails: !showDetails })}
                  className="font-medium text-royal-700 hover:text-royal-900 underline underline-offset-2"
                >
                  {showDetails ? 'Hide technical diagnostics' : 'Show technical diagnostics'}
                </button>
                <button
                  type="button"
                  onClick={this.handleCopyDiagnostics}
                  className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900"
                >
                  {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                  <span>{copied ? 'Copied to clipboard' : 'Copy error log'}</span>
                </button>
              </div>

              {showDetails && (
                <div className="mt-3 text-left">
                  <pre className="max-h-48 overflow-y-auto rounded-xl bg-gray-900 p-3.5 font-mono text-[11px] text-gray-200 scrollbar-thin scrollbar-thumb-gray-700 whitespace-pre-wrap">
                    {error?.stack || 'No stack trace available'}
                    {errorInfo?.componentStack ? `\nComponent Tree:${errorInfo.componentStack}` : ''}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default GlobalErrorBoundary

