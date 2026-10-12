import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router'
import { Inbox } from 'lucide-react'
import LoadingState from '../components/ui/LoadingState'
import ErrorState from '../components/ui/ErrorState'
import { verificationService } from '../services/verificationService'
import { useMarketContext } from '../hooks/useMarketContext'

// Sidebar entry for the review screens (ADM-031 → ADM-034, ADM-042) when no case
// is chosen: opens the oldest open case of that kind from the live queue, or
// says there is nothing to review — never a sample record.
const KIND = {
  review: { title: 'Verification Review', path: (id) => `/verifications/review/${id}`, match: () => true },
  identity: { title: 'Identity Documents', path: (id) => `/verifications/identity/${id}`, match: () => true },
  credentials: { title: 'Professional Credentials', path: (id) => `/verifications/credentials/${id}`, match: (r) => r.providerCategory === 'INDIVIDUAL' || r.verificationTypeKey === 'CREDENTIALS' },
  business: { title: 'Business Documents', path: (id) => `/verifications/business/${id}`, match: (r) => r.providerCategory !== 'INDIVIDUAL' || r.verificationTypeKey === 'BUSINESS_DOCS' },
  decision: { title: 'Verification Decision', path: (id) => `/verifications/${id}/decision`, match: () => true },
}
const CLOSED = new Set(['APPROVED', 'REJECTED', 'VERIFIED'])

export default function VerificationEntry({ kind = 'review' }) {
  const meta = KIND[kind]
  const { selectedMarket } = useMarketContext()
  const [state, setState] = useState({ loading: true, target: null, error: null })

  useEffect(() => {
    let alive = true
    verificationService
      .fetchVerificationQueue({ marketId: selectedMarket?.id || 'ALL' })
      .then((res) => {
        const open = (res?.queue || [])
          .filter((r) => !CLOSED.has(String(r.status || '').toUpperCase()) && meta.match(r))
          .sort((a, b) => (a.submittedAtMs || 0) - (b.submittedAtMs || 0))
        if (alive) setState({ loading: false, target: open[0] ? meta.path(open[0].id) : null, error: null })
      })
      .catch((err) => alive && setState({ loading: false, target: null, error: err?.message || 'The verification queue could not be loaded.' }))
    return () => {
      alive = false
    }
  }, [meta, selectedMarket?.id])

  if (state.loading) return <LoadingState message={`Finding the next ${meta.title.toLowerCase()} case…`} />
  if (state.target) return <Navigate to={state.target} replace />
  if (state.error) return <ErrorState title="Unable to open the queue" description={state.error} className="m-6" />
  return (
    <div className="mx-auto max-w-lg p-10 text-center">
      <Inbox className="mx-auto size-10 text-royal-300" />
      <h1 className="mt-3 text-lg font-bold text-royal-950">No open {meta.title.toLowerCase()} cases</h1>
      <p className="mt-1 text-sm text-gray-500">Everything in this queue has been reviewed for the selected market.</p>
      <Link to="/verifications/queue" className="mt-4 inline-block rounded-xl bg-royal-900 px-4 py-2 text-xs font-semibold text-white">Open Verification Queue</Link>
    </div>
  )
}
