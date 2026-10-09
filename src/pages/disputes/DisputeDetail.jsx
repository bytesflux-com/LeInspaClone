import { useEffect, useState, useCallback } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import {
  ArrowLeft,
  CalendarCheck,
  MapPin,
  Scale,
  ShieldAlert,
  User,
} from 'lucide-react'
import PageContainer from '../../components/layout/PageContainer'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import CountryFlag from '../../components/ui/CountryFlag'
import ErrorState from '../../components/ui/ErrorState'
import LoadingState from '../../components/ui/LoadingState'
import Notice from '../../components/ui/Notice'
import { attentionService } from '../../services/attentionService'
import { formatDisplayCurrency } from '../../lib/currency'

export default function DisputeDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()

  const returnTo = searchParams.get('returnTo') || 'attention'
  const marketParam = searchParams.get('market') || 'ALL'
  const tabParam = searchParams.get('tab') || 'disputes'

  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const backUrl =
    returnTo === 'attention'
      ? `/attention?market=${encodeURIComponent(marketParam)}&tab=${encodeURIComponent(tabParam)}`
      : '/dashboard'

  const fetchRecord = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await attentionService.getReviewItem({
        sourceType: 'dispute',
        sourceId: id,
        marketId: marketParam,
      })
      setRecord(data)
    } catch (err) {
      setError(err?.message || 'Failed to load dispute details.')
      setRecord(null)
    } finally {
      setLoading(false)
    }
  }, [id, marketParam])

  useEffect(() => {
    fetchRecord()
  }, [fetchRecord])

  const statusVariant =
    record?.status === 'resolved'
      ? 'success'
      : record?.status === 'open'
        ? 'danger'
        : 'warning'

  return (
    <PageContainer>
      {/* Navigation Header */}
      <div className="flex flex-col gap-4 border-b border-gray-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <Link to="/dashboard" className="hover:text-royal-700">
              Dashboard
            </Link>
            <span>/</span>
            <Link to={backUrl} className="hover:text-royal-700">
              Needs Attention
            </Link>
            <span>/</span>
            <span className="font-semibold text-gray-900">Booking Dispute</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-royal-950 sm:text-3xl">
            Booking Dispute Review
          </h1>
        </div>

        <Link
          to={backUrl}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs transition hover:bg-gray-50"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Needs Attention</span>
        </Link>
      </div>

      {loading ? <LoadingState message="Loading dispute record…" /> : null}

      {!loading && error ? (
        <ErrorState
          title="Unable to load dispute"
          description={error}
          onRetry={fetchRecord}
          className="my-6"
        />
      ) : null}

      {!loading && record ? (
        <div className="space-y-6">
          {record.isMock && (
            <Notice tone="neutral" title="Development Simulation Mode Active">
              This record is loaded from the development mock fixture dataset. Real backend operations are simulated in memory.
            </Notice>
          )}

          {/* Top Overview Banner */}
          <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 ring-1 ring-rose-200">
                  <Scale className="size-7" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-royal-950">{record.title}</h2>
                    <Badge variant={statusVariant} size="md">
                      {record.status?.toUpperCase()}
                    </Badge>
                    {record.isMock && (
                      <Badge variant="gold" size="sm">
                        SIMULATED DEV FIXTURE
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                    <CountryFlag code={record.countryCode} className="size-3.5" />
                    <span>{record.marketName || record.countryCode}</span>
                    <span>•</span>
                    <span>Case ID: {record.sourceId}</span>
                    {record.createdAt && (
                      <>
                        <span>•</span>
                        <span>Opened {new Date(record.createdAt).toLocaleDateString()}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Safety Notice */}
          <Notice
            tone="attention"
            title="Dispute Mediation & Escrow Protocol"
            icon={ShieldAlert}
          >
            {record.unsupportedReason ||
              'Dispute financial resolution and escrow release require payment gateway integration. Direct modifications are restricted.'}
          </Notice>

          {/* Dispute Details Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Case Information" subtitle="Booking & participant details">
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                  <CalendarCheck className="size-4 text-gray-400" />
                  <div>
                    <span className="block font-medium text-gray-500">Associated Booking Reference</span>
                    <span className="font-semibold text-royal-950 font-mono">
                      {record.bookingId || 'Unlinked booking'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                  <User className="size-4 text-gray-400" />
                  <div>
                    <span className="block font-medium text-gray-500">Complainant Account</span>
                    <span className="font-semibold text-royal-950">
                      {record.complainantId || 'Client'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                  <MapPin className="size-4 text-gray-400" />
                  <div>
                    <span className="block font-medium text-gray-500">Sovereign Jurisdiction</span>
                    <span className="font-semibold text-royal-950">{record.marketName || record.countryCode}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Dispute Claims & Escrow" subtitle="Issue summary and held funds">
              <div className="space-y-4 text-xs">
                <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Escrow Hold Amount
                  </span>
                  <div className="mt-1 text-xl font-black text-rose-700">
                    {formatDisplayCurrency(record.escrowAmount, record.countryCode === 'KE' ? 'KES' : 'USD')}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Dispute Reason & Details
                  </span>
                  <p className="mt-1.5 text-xs text-gray-800 leading-relaxed">
                    {record.reason}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </PageContainer>
  )
}
