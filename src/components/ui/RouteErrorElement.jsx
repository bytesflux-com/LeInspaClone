import { useRouteError, isRouteErrorResponse, Link } from 'react-router'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import Logo from '../brand/Logo.jsx'
import Button from './Button.jsx'

export default function RouteErrorElement() {
  const error = useRouteError()

  let title = 'Application Route Error'
  let message = 'An unexpected routing or loader exception occurred.'

  if (isRouteErrorResponse(error)) {
    title = `${error.status} — ${error.statusText || 'Route Error'}`
    message = error.data?.message || 'The requested administrative resource could not be loaded.'
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/60 p-4 font-sans">
      <div className="w-full max-w-lg rounded-3xl border border-royal-100/80 bg-white p-8 text-center shadow-xl ring-1 ring-black/5">
        <Logo tone="dark" size="sm" />
        <div className="mx-auto mt-6 flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
          <AlertTriangle className="size-7" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-royal-950">{title}</h1>
        <p className="mt-2 text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">{message}</p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            icon={RefreshCw}
            onClick={() => window.location.reload()}
          >
            Retry Action
          </Button>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition"
          >
            <Home className="size-4" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

