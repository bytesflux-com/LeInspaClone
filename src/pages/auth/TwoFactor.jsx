import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { ArrowLeft, ArrowRight, ChartNoAxesColumnIncreasing, Handshake, Mail, RefreshCw, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { adminService } from '../../services/adminService'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import Logo from '../../components/brand/Logo.jsx'
import Button from '../../components/ui/Button.jsx'
import Notice from '../../components/ui/Notice.jsx'
import OtpInput from '../../components/ui/OtpInput.jsx'

const CODE_LENGTH = 6
const emptyCode = () => Array(CODE_LENGTH).fill('')

const brand = {
  title: (
    <>
      Secure
      <span className="block text-gold-300">Administration</span>
      Portal
    </>
  ),
  statement: 'Protecting every market, every transaction, every account.',
  pillars: [
    { icon: ShieldCheck, title: 'Enhanced Security', text: 'Multi-layer protection' },
    { icon: Handshake, title: 'Trusted Operations', text: 'For a safer wellness community' },
    { icon: ChartNoAxesColumnIncreasing, title: 'Global Impact', text: 'Powering wellness across markets' },
  ],
  footerTitle: 'Lé Inspa Administration',
  footerSubtitle: 'Manage today. A healthier tomorrow.',
}

function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function formatTime(iso) {
  return iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null
}

function describeError(err) {
  const reason = err?.details?.reason
  switch (reason) {
    case 'incorrect': {
      const left = err.details.attemptsRemaining
      return {
        kind: 'incorrect',
        title: 'That code isn’t correct. Please try again.',
        body: left != null ? `${left} ${left === 1 ? 'attempt' : 'attempts'} remaining.` : null,
      }
    }
    case 'expired':
      return { kind: 'expired', title: 'This verification code has expired. Request a new code.' }
    case 'locked': {
      const until = formatTime(err.details.lockedUntil)
      return {
        kind: 'locked',
        title: 'Verification temporarily locked for security.',
        body: until ? `You can request a new code after ${until}.` : null,
      }
    }
    case 'admin-revoked':
    case 'not-admin':
      return { kind: 'revoked', title: 'Administrator access is not available for this account.' }
    case 'resend-too-soon':
      return {
        kind: 'notice',
        title: 'Please wait a moment before requesting another code.',
        resendAvailableAt: err.details.resendAvailableAt,
      }
    case 'too-many-requests':
      return { kind: 'locked', title: 'Too many verification requests. Please try again later.' }
    case 'delivery-not-configured':
      return {
        kind: 'delivery',
        title: 'Verification emails are not configured yet.',
        body: 'Contact the Lé Inspa technical team.',
      }
    case 'delivery-failed':
      return { kind: 'delivery', title: 'We couldn’t send the verification code. Please try again.' }
    case 'no-destination':
      return { kind: 'revoked', title: 'This admin account has no verification contact on file.' }
    default:
      if (err?.code === 'functions/unauthenticated') return { kind: 'signed-out' }
      return { kind: 'generic', title: 'Something went wrong. Please try again.' }
  }
}

// ADM-002 — Admin Two-Factor Verification
export default function TwoFactor() {
  const { user, isAdmin, secondFactorVerified, loading, logout, refreshSession } = useAuth()
  const navigate = useNavigate()
  const [challenge, setChallenge] = useState(null)
  const [code, setCode] = useState(emptyCode)
  const [error, setError] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const ready = !loading && user && isAdmin && !secondFactorVerified

  const started = useRef(false)
  useEffect(() => {
    if (!ready || started.current) return
    started.current = true
    adminService
      .startSecondFactor()
      .then(async (result) => {
        if (result.status === 'verified') {
          await refreshSession()
          return
        }
        setChallenge(result)
      })
      .catch((err) => setError(describeError(err)))
  }, [ready, refreshSession])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!loading && (!user || !isAdmin)) return <Navigate to="/login" replace />
  if (!loading && secondFactorVerified) return <Navigate to="/dashboard" replace />
  if (error?.kind === 'signed-out') return <Navigate to="/login" replace />

  const expiresIn = challenge ? new Date(challenge.expiresAt).getTime() - now : null
  const expired = expiresIn !== null && expiresIn <= 0
  const resendAt = challenge?.resendAvailableAt ?? error?.resendAvailableAt ?? null
  const resendIn = resendAt ? new Date(resendAt).getTime() - now : 0
  const blocked = error && ['locked', 'revoked'].includes(error.kind)
  const shownError = expired && !error ? { kind: 'expired', title: 'This verification code has expired. Request a new code.' } : error
  const complete = code.every((d) => d !== '')

  async function submit(value = code.join('')) {
    if (verifying || value.length !== CODE_LENGTH || expired || blocked) return
    setVerifying(true)
    setError(null)
    try {
      await adminService.verifySecondFactor(value)
      await refreshSession()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(describeError(err))
      setCode(emptyCode())
    } finally {
      setVerifying(false)
    }
  }

  async function resend() {
    if (resending || resendIn > 0 || blocked) return
    setResending(true)
    setError(null)
    try {
      const result = await adminService.startSecondFactor({ resend: true })
      setChallenge(result)
      setCode(emptyCode())
    } catch (err) {
      setError(describeError(err))
    } finally {
      setResending(false)
    }
  }

  async function cancel() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <AuthLayout brand={brand}>
      <div className="text-center">
        <Logo tone="dark" size="sm" />
        <h1 className="mt-6 text-[1.75rem] font-semibold tracking-tight text-royal-950">Security Verification</h1>
        <p className="mt-1.5 text-sm text-gray-700">Enter the 6-digit code sent to your registered email</p>
      </div>

      <div className="mt-8 rounded-2xl border border-royal-100/70 bg-white p-6 shadow-card sm:p-8">
        {challenge?.maskedDestination && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-lavender-200 bg-lavender-100 px-4 py-3 text-xs text-royal-950">
            <Mail className="size-4 text-royal-700 shrink-0" />
            <span>Sent to <strong className="font-semibold">{challenge.maskedDestination}</strong></span>
          </div>
        )}

        {shownError && (
          <Notice
            tone={shownError.kind === 'notice' ? 'attention' : 'error'}
            title={shownError.title}
            className="mb-5"
          >
            {shownError.body}
          </Notice>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          className="space-y-6"
        >
          <div className="flex justify-center">
            <OtpInput
              value={code}
              onChange={setCode}
              onComplete={submit}
              disabled={verifying || blocked || expired}
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            {expiresIn !== null && expiresIn > 0 ? (
              <span>Code expires in <strong className="font-mono text-gray-800">{formatClock(expiresIn)}</strong></span>
            ) : (
              <span>Code expired</span>
            )}

            <button
              type="button"
              onClick={resend}
              disabled={resending || resendIn > 0 || blocked}
              className="inline-flex items-center gap-1 font-semibold text-royal-700 hover:text-royal-900 disabled:opacity-50"
            >
              <RefreshCw className={`size-3 ${resending ? 'animate-spin' : ''}`} />
              {resendIn > 0 ? `Resend in ${formatClock(resendIn)}` : 'Resend Code'}
            </button>
          </div>

          <Button
            type="submit"
            fullWidth
            icon={ArrowRight}
            loading={verifying}
            loadingText="Verifying Code…"
            disabled={!complete || blocked || expired}
          >
            Confirm &amp; Proceed to Control Center
          </Button>
        </form>

        <div className="mt-6 border-t border-gray-100 pt-4 text-center">
          <button
            type="button"
            onClick={cancel}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-royal-900"
          >
            <ArrowLeft className="size-3.5" /> Cancel &amp; Return to Sign In
          </button>
        </div>
      </div>
    </AuthLayout>
  )
}

