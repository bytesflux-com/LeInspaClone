import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, CalendarClock, Scale, ShieldAlert, UserRound } from 'lucide-react'
import PageContainer from '../../components/layout/PageContainer'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import CountryFlag from '../../components/ui/CountryFlag'
import ErrorState from '../../components/ui/ErrorState'
import LoadingState from '../../components/ui/LoadingState'
import Notice from '../../components/ui/Notice'
import { attentionService } from '../../services/attentionService'

// Read-only case view for disputes and safety reports reached from Needs Your
// Attention (ADM-009), booking details and provider/client screens. The full
// Dispute Center (ADM-069+) and Safety Investigation workflows are separate
// modules; this page shows the live record and links to every related entity.
const KINDS = {
  dispute: { sourceType: 'dispute', tab: 'disputes', label: 'Dispute', icon: Scale },
  safety: { sourceType: 'safety_report', tab: 'safety', label: 'Safety Report', icon: ShieldAlert },
}

function Field({ label, children }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <span className="block text-[11px] font-medium text-gray-500">{label}</span>
      <span className="mt-0.5 block text-xs font-semibold text-royal-950">{children ?? '—'}</span>
    </div>
  )
}

function PartyLink({ party }) {
  const to = party.role === 'provider' ? `/providers/${party.id}` : party.role === 'client' ? `/clients/${party.id}` : null
  const text = party.name || party.id
  return to ? <Link to={to} className="text-royal-700 hover:underline">{text}</Link> : <span>{text}</span>
}

export default function CaseDetail({ kind = 'dispute' }) {
  const meta = KINDS[kind]
  const Icon = meta.icon
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const marketParam = searchParams.get('market') || 'ALL'
  const backUrl = location.state?.returnTo
    || (searchParams.get('returnTo') === 'attention' ? `/attention?market=${encodeURIComponent(marketParam)}&tab=${encodeURIComponent(searchParams.get('tab') || meta.tab)}` : `/attention?tab=${meta.tab}`)

  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRecord = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRecord(await attentionService.getReviewItem({ sourceType: meta.sourceType, sourceId: id, marketId: marketParam }))
    } catch (err) {
      setRecord(null)
      setError(err?.message || `The ${meta.label.toLowerCase()} could not be loaded.`)
    } finally {
      setLoading(false)
    }
  }, [id, marketParam, meta])

  useEffect(() => {
    fetchRecord()
  }, [fetchRecord])

  const closed = ['resolved', 'closed', 'dismissed'].includes(String(record?.status || '').toLowerCase())
  const parties = record?.parties || [
    record?.clientId && { label: 'Client', id: record.clientId, name: record.clientName, role: 'client' },
    record?.providerId && { label: 'Provider', id: record.providerId, name: record.providerName, role: 'provider' },
  ].filter(Boolean)

  return (
    <PageContainer>
      <div className="flex flex-col gap-4 border-b border-gray-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <Link to="/dashboard" className="hover:text-royal-700">Dashboard</Link>
            <span>/</span>
            <Link to={`/attention?tab=${meta.tab}`} className="hover:text-royal-700">Needs Attention</Link>
            <span>/</span>
            <span className="font-semibold text-gray-900">{meta.label}</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-royal-950 sm:text-3xl">{meta.label} Review</h1>
        </div>
        <Link to={backUrl} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs transition hover:bg-gray-50">
          <ArrowLeft className="size-4" /> Back
        </Link>
      </div>

      {loading && <LoadingState message={`Loading ${meta.label.toLowerCase()}…`} />}
      {!loading && error && <ErrorState title={`Unable to load ${meta.label.toLowerCase()}`} description={error} onRetry={fetchRecord} className="my-6" />}

      {!loading && record && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs">
            <div className="flex items-start gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-royal-50 text-royal-800 ring-1 ring-royal-200">
                <Icon className="size-7" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-royal-950">{record.title}</h2>
                  <Badge variant={closed ? 'success' : 'warning'} size="md">{String(record.status || 'open').toUpperCase()}</Badge>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-medium text-gray-500">
                  <CountryFlag code={record.countryCode} className="size-3.5" />
                  <span>{record.marketName || record.countryCode || 'Market unknown'}</span>
                  <span>•</span>
                  <span className="font-mono">{record.sourceId}</span>
                  {record.createdAt && (<><span>•</span><span>Opened {new Date(record.createdAt).toLocaleString()}</span></>)}
                </p>
              </div>
            </div>
          </div>

          {record.unsupportedReason && <Notice tone="attention" title="Handled in a dedicated workflow">{record.unsupportedReason}</Notice>}

          <div className="grid gap-6 lg:grid-cols-3">
            <Card title="Case Details" subtitle="As recorded by the app" className="lg:col-span-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={kind === 'dispute' ? 'Reason' : 'Issue Type'}>{kind === 'dispute' ? record.reason : record.title}</Field>
                <Field label="Status">{record.status}</Field>
                {kind === 'dispute' && <Field label="Amount in Dispute">{record.escrowAmount ? Number(record.escrowAmount).toLocaleString() : null}</Field>}
                {kind === 'dispute' && <Field label="Raised By (role)">{record.raisedBy}</Field>}
                <Field label="Booking">
                  {record.bookingId ? <Link to={`/bookings/${record.bookingId}`} state={{ returnTo: location.pathname }} className="font-mono text-royal-700 hover:underline">{record.bookingId}</Link> : null}
                </Field>
                <Field label="Opened">{record.createdAt ? new Date(record.createdAt).toLocaleString() : null}</Field>
              </div>
              {record.details && <p className="mt-3 whitespace-pre-line rounded-xl border border-gray-100 bg-gray-50/70 p-3 text-xs leading-relaxed text-gray-800">{record.details}</p>}
            </Card>

            <Card title="People Involved" subtitle="Open the related account">
              <div className="space-y-2 text-xs">
                {parties.length ? parties.map((p) => (
                  <div key={`${p.label}-${p.id}`} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                    <UserRound className="size-4 shrink-0 text-gray-400" />
                    <div className="min-w-0">
                      <span className="block font-medium text-gray-500">{p.label}{p.role ? ` · ${p.role}` : ''}</span>
                      <span className="block truncate font-semibold"><PartyLink party={p} /></span>
                    </div>
                  </div>
                )) : <p className="text-gray-500">No linked accounts on this record.</p>}
                {record.bookingId && (
                  <Link to={`/bookings/${record.bookingId}`} state={{ returnTo: location.pathname }} className="flex items-center gap-3 rounded-xl border border-royal-100 p-3 font-semibold text-royal-700 hover:bg-royal-50">
                    <CalendarClock className="size-4" /> Open booking
                  </Link>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
