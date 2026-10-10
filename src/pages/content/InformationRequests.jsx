import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { FileQuestion, FlaskConical, RefreshCw } from 'lucide-react'
import ErrorState from '../../components/ui/ErrorState'
import Skeleton from '../../components/ui/Skeleton'
import CountryFlag from '../../components/ui/CountryFlag'
import { useMarketContext } from '../../hooks/useMarketContext'
import { infoRequestService } from '../../services/infoRequestService'
import { INFO_REQUESTS, INFO_STATUS } from '../../constants/contentModeration'
import { cn } from '../../lib/utils'
import { CARD, PillTabs, StatePill } from '../../components/bookings/OpsUI'
import { stamp } from '../../components/content/ContentUI'

const TABS = [['', 'All'], ['waiting', 'Waiting'], ['partially_responded', 'Partial'], ['responded', 'Responded'], ['overdue', 'Overdue'], ['draft', 'Drafts'], ['completed', 'Completed'], ['cancelled', 'Cancelled']]
const MODULE = { verification: 'Verification', content: 'Content Moderation', profile_change: 'Profile Changes', service: 'Service Review', account: 'Account', safety: 'Trust & Safety', finance: 'Finance' }

// ADM-040 — tracking list of every information request the admin can see.
// New requests are always started from a review so they keep their origin.
export default function InformationRequests() {
  const { selectedMarket } = useMarketContext()
  const [status, setStatus] = useState('')
  const [state, setState] = useState({ data: null, error: null })
  const [nonce, setNonce] = useState(0)
  useEffect(() => {
    let cancelled = false
    infoRequestService.list({ market: selectedMarket.id }).then((data) => !cancelled && setState({ data, error: null })).catch((err) => !cancelled && setState({ data: null, error: err?.message || 'Unable to load requests.' }))
    return () => {
      cancelled = true
    }
  }, [selectedMarket.id, nonce])
  const items = (state.data?.items || []).filter((r) => !status || r.status === status || (status === 'waiting' && r.status === 'sent'))

  return (
    <div className="min-h-full space-y-3 px-4 pt-3 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-11 items-center justify-center rounded-xl bg-[#4125d0] text-white shadow"><FileQuestion className="size-6" /></span>
          <div>
            <h1 className="font-display text-[34px] leading-none font-bold tracking-tight text-[#1b1140]">Request More Information</h1>
            <p className="mt-1 flex items-center gap-2 text-[13px] text-[#2a1b57]">Track information requests sent to providers across verification, moderation and account reviews.{infoRequestService.isMock && <span className="inline-flex items-center gap-1 rounded-md bg-[#fff4e0] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#9a5a06]"><FlaskConical className="size-3" />Demo data</span>}</p>
          </div>
        </div>
        <button type="button" onClick={() => setNonce((n) => n + 1)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#ddd7ee] bg-white px-3.5 text-[12.5px] font-semibold text-[#1b1140] hover:bg-[#f4f1fc]"><RefreshCw className="size-4" />Refresh</button>
      </header>
      <PillTabs label="Request status" tabs={TABS.map(([id, l]) => ({ id, label: l, count: id ? (state.data?.counts[id] || 0) + (id === 'waiting' ? state.data?.counts.sent || 0 : 0) : state.data?.items.length }))} value={status} onChange={setStatus} />
      <p className="text-[12px] text-[#6b6785]">Start a new request from inside a review (Profile Change, Service, Content or Verification) so it keeps its originating case.</p>
      {state.error ? <ErrorState title="Unable to load requests" description={state.error} onRetry={() => setNonce((n) => n + 1)} /> : (
        <section className={cn(CARD, 'overflow-x-auto p-3.5')}>
          {!state.data ? <div className="space-y-2">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-10" />)}</div> : items.length === 0 ? <p className="py-10 text-center text-[12.5px] text-[#6b6785]">No information requests here.</p> : (
            <table className="w-full min-w-[820px] text-[12px]">
              <thead><tr className="bg-[#f1eefb] text-left text-[11.5px] text-[#1b1140]">{['Request', 'Provider', 'Module', 'Items', 'Sent', 'Due', 'Status', 'Sent by'].map((h, i, a) => <th key={h} className={cn('px-2 py-2 font-semibold', i === 0 && 'rounded-l-lg', i === a.length - 1 && 'rounded-r-lg')}>{h}</th>)}</tr></thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.requestId} className="border-b border-[#efecf7] hover:bg-[#faf9fe]">
                    <td className="px-2 py-2"><Link to={`${INFO_REQUESTS}/${r.requestId}`} className="font-semibold text-[#4527c8] hover:underline">{r.reference}</Link><span className="block text-[11px] text-[#6b6785]">{r.requestTypeLabel}</span></td>
                    <td className="px-2 py-2"><span className="flex items-center gap-1.5 font-medium text-[#1b1140]"><CountryFlag code={r.countryCode} className="h-3 w-4.5" />{r.origin?.provider?.name}</span><span className="block text-[11px] text-[#6b6785]">{r.origin?.caseId}</span></td>
                    <td className="px-2 py-2 text-[#2a1b57]">{MODULE[r.originModule]}</td>
                    <td className="px-2 py-2 text-[#2a1b57]">{r.progress.received}/{r.progress.total} received</td>
                    <td className="px-2 py-2 whitespace-nowrap">{r.sentAt ? stamp(r.sentAt, r.countryCode) : '—'}</td>
                    <td className="px-2 py-2 whitespace-nowrap">{r.dueAt ? stamp(r.dueAt, r.countryCode).split(' • ')[0] : '—'}</td>
                    <td className="px-2 py-2"><StatePill map={INFO_STATUS} value={r.status} /></td>
                    <td className="px-2 py-2 whitespace-nowrap">{r.createdBy?.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  )
}
