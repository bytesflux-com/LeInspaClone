import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  EyeOff,
  History,
  Lock,
  LockKeyhole,
  Mail,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { adminService } from '../../services/adminService'
import { passwordRules } from '../../lib/passwordPolicy'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import Logo from '../../components/brand/Logo.jsx'
import Button from '../../components/ui/Button.jsx'
import Notice from '../../components/ui/Notice.jsx'
import OtpInput from '../../components/ui/OtpInput.jsx'
import PasswordField from '../../components/ui/PasswordField.jsx'
import Steps from '../../components/ui/Steps.jsx'
import TextField from '../../components/ui/TextField.jsx'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RESEND_DELAY_MS = 60 * 1000
const emptyCode = () => Array(6).fill('')

const brand = {
  title: (
    <>
      Recover
      <span className="block text-gold-300">Securely</span>
    </>
  ),
  statement: 'Regain access to the Lé Inspa Administration Portal safely.',
  pillars: [
    { icon: ShieldCheck, title: 'Protected Recovery', text: 'Identity verification required.' },
    { icon: LockKeyhole, title: 'Secure Reset', text: 'Recovery links and codes expire.' },
    { icon: History, title: 'Account Activity Protected', text: 'Important recovery activity is recorded.' },
  ],
  footerTitle: 'Lé Inspa Administration',
  footerSubtitle: 'Manage today. A healthier tomorrow.',
}

const STEPS = ['Enter Email', 'Verify Identity', 'Create New Password', 'Access Restored']

const headings = [
  ['Forgot Your Password?', 'Enter the email address associated with your Lé Inspa Admin account.'],
  ['Verify Recovery Request', 'Enter the 6-digit code sent to your registered Admin contact.'],
  ['Create a New Password', 'Choose a strong password you haven’t used for this Admin account before.'],
  ['Access Restored', 'You can now sign in with your new password.'],
]

function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

function describeError(err) {
  const d = err?.details ?? {}
  switch (d.reason) {
    case 'incorrect':
      return { title: 'That code isn’t correct. Please try again.', field: 'code' }
    case 'expired':
      return { title: 'This verification code has expired. Request a new code.' }
    case 'locked': {
      const until = d.lockedUntil
        ? new Date(d.lockedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : null
      return { title: 'Verification temporarily locked for security.', body: until && `Try again after ${until}.` }
    }
    case 'reset-expired':
      return { title: 'This recovery session has expired. Please start again.', restart: true }
    case 'not-eligible':
      return { title: 'This account can’t be recovered. Contact your Lé Inspa security lead.', restart: true }
    case 'weak-password':
      return { title: 'Choose a stronger password.', body: `Use ${(d.problems ?? []).join(', ')}.` }
    case 'invalid-email':
      return { title: 'Enter a valid email address.', field: 'email' }
    default:
      if (err?.code === 'functions/unavailable') {
        return { title: 'Unable to reach Lé Inspa. Check your connection and try again.' }
      }
      return { title: 'Something went wrong. Please try again.' }
  }
}

function RuleItem({ met, children }) {
  return (
    <li className={`flex items-center gap-2 text-xs ${met ? 'text-success-600' : 'text-gray-500'}`}>
      <span
        className={`flex size-4 items-center justify-center rounded-full ${met ? 'bg-success-600 text-white' : 'border border-gray-300'}`}
        aria-hidden="true"
      >
        {met && <Check className="size-3" strokeWidth={3} />}
      </span>
      {children}
      <span className="sr-only">{met ? '(met)' : '(not met)'}</span>
    </li>
  )
}

function TrustRow() {
  const items = [
    { icon: Lock, text: 'Your information is encrypted' },
    { icon: Users, text: 'Admin access is strictly controlled' },
    { icon: EyeOff, text: 'We never share your details' },
  ]
  return (
    <ul className="mt-6 grid grid-cols-3 divide-x divide-gray-200 border-t border-gray-200 pt-5">
      {items.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-center gap-2 px-2 text-[0.7rem] leading-snug text-gray-700 first:pl-0 last:pr-0">
          <Icon className="size-5 shrink-0 text-royal-800" aria-hidden="true" />
          {text}
        </li>
      ))}
    </ul>
  )
}

// ADM-003 — Admin Password Recovery
export default function ForgotPassword() {
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [destination, setDestination] = useState('')
  const [code, setCode] = useState(emptyCode)
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [resendAt, setResendAt] = useState(0)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const normalizedEmail = email.trim().toLowerCase()
  const rulesMet = passwordRules.map((r) => r.test(password))
  const passwordsMatch = password.length > 0 && password === confirm
  const passwordReady = rulesMet.every(Boolean) && passwordsMatch
  const resendIn = resendAt - now

  function restart() {
    setStep(0)
    setCode(emptyCode())
    setResetToken('')
    setPassword('')
    setConfirm('')
    setError(null)
  }

  async function run(action) {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (err) {
      console.error(err)
      setError(describeError(err))
    } finally {
      setBusy(false)
    }
  }

  function submitEmail(e) {
    e.preventDefault()
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setEmailError('Enter a valid email address.')
      return
    }
    setEmailError('')
    run(async () => {
      const result = await adminService.requestPasswordReset(normalizedEmail)
      setDestination(result.destination)
      setResendAt(Date.now() + RESEND_DELAY_MS)
      setCode(emptyCode())
      setStep(1)
    })
  }

  function resend() {
    run(async () => {
      await adminService.requestPasswordReset(normalizedEmail, { resend: true })
      setResendAt(Date.now() + RESEND_DELAY_MS)
      setCode(emptyCode())
    })
  }

  function submitCode(value = code.join('')) {
    if (busy || value.length !== 6) return
    run(async () => {
      try {
        const result = await adminService.verifyPasswordReset(normalizedEmail, value)
        setResetToken(result.resetToken)
        setStep(2)
      } catch (err) {
        setCode(emptyCode())
        throw err
      }
    })
  }

  function submitPassword(e) {
    e.preventDefault()
    if (!passwordReady) return
    run(async () => {
      await adminService.completePasswordReset(normalizedEmail, resetToken, password)
      setPassword('')
      setConfirm('')
      setResetToken('')
      setStep(3)
    })
  }

  const [title, subtitle] = headings[step]

  return (
    <AuthLayout brand={brand}>
      <div className="text-center">
        <Logo tone="dark" size="sm" />
      </div>
      {step < 3 && (
        <Link
          to="/login"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-royal-700 hover:text-royal-900"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to Sign In
        </Link>
      )}
      <div className={`text-center ${step < 3 ? 'mt-3' : 'mt-6'}`}>
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-royal-950">{title}</h1>
        <p className="mt-1.5 text-sm text-gray-700">{subtitle}</p>
      </div>

      <div className="mt-6">
        <Steps steps={STEPS} current={step} />
      </div>

      <div className="mt-6 rounded-2xl border border-royal-100/70 bg-white p-6 shadow-card sm:p-8">
        {step === 0 && (
          <form onSubmit={submitEmail} noValidate className="space-y-5">
            <TextField
              label="Admin Email Address"
              icon={Mail}
              type="email"
              autoComplete="username"
              placeholder="admin@leinspa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError || (error?.field === 'email' ? error.title : '')}
              disabled={busy}
              autoFocus
            />
            {error && error.field !== 'email' && <Notice tone="error" title={error.title}>{error.body}</Notice>}
            <Button type="submit" fullWidth icon={ArrowRight} loading={busy} loadingText="Sending securely…">
              Continue Securely
            </Button>
            <Notice tone="security" title="Secure Account Recovery">
              If the information matches an authorized Admin account, we’ll send the next recovery instructions
              securely.
            </Notice>
          </form>
        )}

        {step === 1 && (
          <div>
            <Notice tone="security" icon={MailCheck} title="Check Your Email">
              If an authorized Lé Inspa Admin account matches the information provided, a 6-digit recovery code has
              been sent to <span className="font-semibold text-royal-950">{destination}</span>.
            </Notice>
            <form
              className="mt-6"
              onSubmit={(e) => {
                e.preventDefault()
                submitCode()
              }}
            >
              <OtpInput
                value={code}
                onChange={(next) => {
                  setCode(next)
                  if (error?.field === 'code') setError(null)
                }}
                onComplete={submitCode}
                error={error?.field === 'code'}
                disabled={busy}
                autoFocus
                label="Recovery code"
              />
              <p className="mt-3 text-center text-xs text-gray-600">Codes expire after 5 minutes.</p>
              {error && (
                <Notice tone="error" title={error.title} className="mt-4">
                  {error.body}
                </Notice>
              )}
              <Button
                type="submit"
                fullWidth
                icon={ArrowRight}
                loading={busy}
                loadingText="Verifying…"
                disabled={code.some((d) => d === '')}
                className="mt-5"
              >
                Verify Code
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-700">
              Didn’t receive the code?{' '}
              <button
                type="button"
                onClick={resend}
                disabled={busy || resendIn > 0}
                className="inline-flex items-center gap-1 font-medium text-royal-700 underline underline-offset-2 hover:text-royal-900 disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
              >
                {busy && <RefreshCw className="size-3.5 animate-spin" aria-hidden="true" />}
                {resendIn > 0 ? `Resend in ${formatClock(resendIn)}` : 'Resend Code'}
              </button>
            </p>
            <p className="mt-2 text-center">
              <button type="button" onClick={restart} className="text-xs text-gray-600 underline underline-offset-2 hover:text-royal-800">
                Use a different email
              </button>
            </p>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={submitPassword} noValidate className="space-y-5">
            <PasswordField
              label="New Password"
              autoComplete="new-password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              autoFocus
            />
            <PasswordField
              label="Confirm New Password"
              icon={LockKeyhole}
              autoComplete="new-password"
              placeholder="Re-enter the password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={busy}
            />
            <ul className="grid gap-2 sm:grid-cols-2" aria-label="Password requirements">
              {passwordRules.map((rule, i) => (
                <RuleItem key={rule.id} met={rulesMet[i]}>
                  {rule.label}
                </RuleItem>
              ))}
              <RuleItem met={passwordsMatch}>Passwords match</RuleItem>
            </ul>
            {error && (
              <Notice tone="error" title={error.title}>
                {error.body}
              </Notice>
            )}
            {error?.restart ? (
              <Button fullWidth variant="secondary" onClick={restart}>
                Start again
              </Button>
            ) : (
              <Button type="submit" fullWidth icon={ArrowRight} loading={busy} loadingText="Resetting…" disabled={!passwordReady}>
                Reset Password
              </Button>
            )}
          </form>
        )}

        {step === 3 && (
          <div className="text-center">
            <CircleCheck className="mx-auto size-16 text-success-600" strokeWidth={1.5} aria-hidden="true" />
            <h2 className="mt-4 text-xl font-semibold text-success-600">Password Reset Successfully</h2>
            <p className="mt-1.5 text-sm text-gray-700">Your Admin password has been updated.</p>
            <Notice tone="security" title="Sessions signed out" className="mt-6 text-left">
              For your protection, every signed-in Admin session has been signed out. Sign in again with your new
              password and complete verification.
            </Notice>
            <Link
              to="/login"
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-royal-800 to-royal-600 px-6 text-[0.95rem] font-medium text-white shadow-[0_8px_20px_-6px_rgb(74_43_138/0.55)] hover:from-royal-900 hover:to-royal-700"
            >
              Return to Admin Login <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        )}

        {step === 0 && <TrustRow />}
      </div>
    </AuthLayout>
  )
}

