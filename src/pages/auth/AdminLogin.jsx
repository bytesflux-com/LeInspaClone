import { useState } from 'react'
import { takeEndedReason } from '../../lib/sessionLock'
import { Link, Navigate, useNavigate } from 'react-router'
import { ArrowRight, Mail } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import Logo from '../../components/brand/Logo.jsx'
import Button from '../../components/ui/Button.jsx'
import Checkbox from '../../components/ui/Checkbox.jsx'
import Notice from '../../components/ui/Notice.jsx'
import PasswordField from '../../components/ui/PasswordField.jsx'
import TextField from '../../components/ui/TextField.jsx'

const endedMessages = {
  'too-many-attempts': 'For security, your Admin session was locked. Please sign in again.',
  'session-expired': 'Your session has ended. Please sign in again.',
  'session-revoked': 'Your session has ended. Please sign in again.',
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function messageFor(error) {
  switch (error?.code) {
    case 'auth/too-many-requests':
      return 'Too many sign-in attempts. Please wait a few minutes and try again.'
    case 'auth/network-request-failed':
      return 'Unable to reach Lé Inspa. Check your connection and try again.'
    default:
      return 'Email or password is incorrect.'
  }
}

// ADM-001 — Admin Login
export default function AdminLogin() {
  const { user, isAdmin, secondFactorVerified, loading, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [authError, setAuthError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [endedNotice] = useState(() => endedMessages[takeEndedReason()] ?? null)

  if (!submitting && !loading && user && isAdmin) {
    return <Navigate to={secondFactorVerified ? '/dashboard' : '/verify'} replace />
  }

  function validate() {
    const errors = {}
    if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address.'
    if (!password) errors.password = 'Enter your password.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setAuthError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      await login(email.trim(), password, { remember })
      navigate('/verify', { replace: true })
    } catch (err) {
      setAuthError(messageFor(err))
      setPassword('')
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="text-center">
        <Logo tone="dark" size="sm" />
        <h1 className="mt-6 text-[1.75rem] font-semibold tracking-tight text-royal-950">Welcome Back</h1>
        <p className="mt-1.5 text-sm text-gray-700">Sign in to the Lé Inspa Admin Control Center</p>
      </div>

      <div className="mt-8 rounded-2xl border border-royal-100/70 bg-white p-6 shadow-card sm:p-8">
        {endedNotice && <Notice tone="attention" title={endedNotice} className="mb-5" />}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <TextField
            label="Email Address"
            icon={Mail}
            type="email"
            name="email"
            autoComplete="username"
            placeholder="admin@leinspa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            disabled={submitting}
            autoFocus
          />

          <PasswordField
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            disabled={submitting}
          />

          <div className="flex items-center justify-between gap-4">
            <Checkbox
              label="Remember this device"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              disabled={submitting}
            />
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-royal-700 underline underline-offset-2 hover:text-royal-900"
            >
              Forgot Password?
            </Link>
          </div>

          {authError && <Notice tone="error" title={authError} />}

          <Button type="submit" fullWidth icon={ArrowRight} loading={submitting} loadingText="Signing in…">
            Sign In Securely
          </Button>
        </form>

        <div className="my-6 flex items-center gap-4 text-sm text-gray-600" aria-hidden="true">
          <span className="h-px flex-1 bg-gray-200" />
          or
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <Notice tone="security" title="Protected Admin Access">
          Administrative activity is monitored and recorded to protect Lé Inspa, its users and providers.
        </Notice>
      </div>
    </AuthLayout>
  )
}

