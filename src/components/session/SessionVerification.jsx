import { useState } from 'react'
import { ArrowRight, LogOut, ShieldAlert, ShieldCheck } from 'lucide-react'
import { verifySession } from '../../lib/api'
import Logo from '../brand/Logo.jsx'
import Button from '../ui/Button.jsx'
import Notice from '../ui/Notice.jsx'
import PasswordField from '../ui/PasswordField.jsx'

function initials(name) {
  return (name || 'Admin')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
}

function Terminal({ icon: Icon, title, body, action, onAction }) {
  return (
    <div className="text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-danger-50 text-danger-600">
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <h2 id="session-title" className="mt-4 text-xl font-semibold text-royal-950">
        {title}
      </h2>
      <p className="mt-2 text-sm text-gray-700">{body}</p>
      <Button fullWidth className="mt-6" icon={ArrowRight} onClick={onAction}>
        {action}
      </Button>
    </div>
  )
}

// ADM-004 — Admin Session Verification card. There is deliberately no way to
// dismiss it: verify, or sign out.
export default function SessionVerification({ identity, lockedAt, onVerified, onSignOut }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!password || busy) return
    setBusy(true)
    setError(null)
    try {
      const result = await verifySession(password)
      setPassword('')
      onVerified(result)
    } catch (err) {
      const reason = err?.details?.reason
      if (reason === 'too-many-attempts') setError({ kind: 'locked-out' })
      else if (reason === 'admin-revoked' || reason === 'not-admin') setError({ kind: 'revoked' })
      else if (err?.code === 'functions/unauthenticated') setError({ kind: 'ended' })
      else if (reason === 'incorrect') setError({ kind: 'incorrect' })
      else setError({ kind: 'generic' })
      setPassword('')
      setBusy(false)
      return
    }
    setBusy(false)
  }

  const time = lockedAt ? new Date(lockedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-royal-950/35 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-title"
        className="w-full max-w-[26rem] rounded-2xl border border-royal-100/70 bg-white p-6 shadow-card sm:p-8"
      >
        {error?.kind === 'locked-out' ? (
          <Terminal
            icon={ShieldAlert}
            title="Session Locked"
            body="For security, this Admin session has been locked. Please sign in again."
            action="Return to Admin Login"
            onAction={onSignOut}
          />
        ) : error?.kind === 'revoked' ? (
          <Terminal
            icon={ShieldAlert}
            title="Admin Access Unavailable"
            body="This account can no longer access the Lé Inspa Admin Control Center."
            action="Return to Admin Login"
            onAction={onSignOut}
          />
        ) : error?.kind === 'ended' ? (
          <Terminal
            icon={ShieldAlert}
            title="Session Ended"
            body="Your session has ended. Please sign in again."
            action="Return to Admin Login"
            onAction={onSignOut}
          />
        ) : (
          <>
            <div className="text-center">
              <Logo tone="dark" size="sm" />
              <span className="mx-auto mt-5 flex size-11 items-center justify-center rounded-full bg-linear-to-br from-royal-500 to-royal-800 text-white">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <h2 id="session-title" className="mt-4 text-[1.4rem] font-semibold tracking-tight text-royal-950">
                Verify Your Admin Session
              </h2>
              <p className="mt-1.5 text-sm text-gray-700">For your security, please confirm it’s you before continuing.</p>
              {time && <p className="mt-1 text-xs text-gray-500">Session locked • {time}</p>}
            </div>

            <div className="mt-6 flex items-center gap-4 rounded-xl border border-lavender-200 bg-lavender-100 p-4">
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-royal-700 text-sm font-semibold text-white"
                aria-hidden="true"
              >
                {initials(identity?.fullName)}
              </span>
              <div className="min-w-0 text-sm">
                <p className="truncate font-semibold text-royal-950">{identity?.fullName || 'Lé Inspa Admin'}</p>
                <p className="text-xs text-royal-800">{identity?.roleName ?? 'Admin'}</p>
                <p className="truncate text-xs text-gray-600">{identity?.email}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-success-600">
                  <span className="size-2 rounded-full bg-success-600" aria-hidden="true" />
                  Authorized Admin Account
                </p>
              </div>
            </div>

            <form onSubmit={submit} noValidate className="mt-6 space-y-5">
              <PasswordField
                label="Admin Password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={error?.kind === 'incorrect' ? 'We couldn’t verify your identity. Please try again.' : undefined}
                disabled={busy}
                autoFocus
              />
              {error?.kind === 'generic' && <Notice tone="error" title="Something went wrong. Please try again." />}
              <Button type="submit" fullWidth icon={ArrowRight} loading={busy} loadingText="Verifying…" disabled={!password}>
                Verify &amp; Continue
              </Button>
            </form>

            <Notice tone="security" title="Why am I seeing this?" className="mt-6">
              Lé Inspa may ask you to verify your session after inactivity or before certain sensitive administrative
              actions.
            </Notice>

            <button
              type="button"
              onClick={onSignOut}
              className="mx-auto mt-5 flex items-center gap-2 text-sm font-medium text-royal-700 hover:text-royal-900"
            >
              <LogOut className="size-4" aria-hidden="true" /> Not You? Sign Out
            </button>
          </>
        )}
      </div>
    </div>
  )
}
