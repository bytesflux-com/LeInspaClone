import { useEffect, useState, useCallback } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import {
  ArrowLeft,
  Banknote,
  CreditCard,
  MapPin,
  ShieldCheck,
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

export default function WithdrawalDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()

  const returnTo = searchParams.get('returnTo') || 'attention'
  const marketParam = searchParams.get('market') || 'ALL'
  const tabParam = searchParams.get('tab') || 'finance'

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
        sourceType: 'withdrawal_request',
        sourceId: id,
        marketId: marketParam,
      })
      setRecord(data)
    } catch (err) {
      setError(err?.message || 'Failed to load withdrawal request details.')
      setRecord(null)
    } finally {
      setLoading(false)
    }
  }, [id, marketParam])

  useEffect(() => {
    fetchRecord()
  }, [fetchRecord])

  const statusVariant =
    record?.status === 'completed'
      ? 'success'
      : record?.status === 'failed' || record?.status === 'rejected'
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
            <span className="font-semibold text-gray-900">Withdrawal Request</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-royal-950 sm:text-3xl">
            Withdrawal Authorization Review
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

      {loading ? <LoadingState message="Loading withdrawal record…" /> : null}

      {!loading && error ? (
        <ErrorState
          title="Unable to load withdrawal request"
          description={error}
          onRetry={fetchRecord}
          className="my-6"
        />
      ) : null}

      {!loading && record ? (
        <div className="space-y-6">
          {record.isMock && (
            <Notice tone="attention" title="Development Simulation Mode Active">
              This record is loaded from the development mock fixture dataset. Real backend operations are simulated in memory.
            </Notice>
          )}

          {/* Top Overview Banner */}
          <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-800 ring-1 ring-amber-200">
                  <Banknote className="size-7" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-black text-royal-950">
                      {formatDisplayCurrency(record.amount, record.currency)}
                    </h2>
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
                    <span>Request ID: {record.sourceId}</span>
                    {record.createdAt && (
                      <>
                        <span>•</span>
                        <span>Submitted {new Date(record.createdAt).toLocaleString()}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Safety & Architecture Guard Notice */}
          <Notice
            tone="security"
            title="Financial Execution Rail Notice"
            icon={ShieldCheck}
          >
            {record.unsupportedReason ||
              'Automated payout execution rail is not connected in this environment. Direct ledger mutations are restricted to prevent financial discrepancies.'}
          </Notice>

          {/* Request Details Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Beneficiary Information" subtitle="Provider destination details">
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                  <User className="size-4 text-gray-400" />
                  <div>
                    <span className="block font-medium text-gray-500">Provider Account ID</span>
                    <span className="font-semibold text-royal-950">{record.providerId || 'Provider ID not provided'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                  <CreditCard className="size-4 text-gray-400" />
                  <div>
                    <span className="block font-medium text-gray-500">Payout Channel / Method</span>
                    <span className="font-semibold text-royal-950">{record.paymentMethod}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                  <Banknote className="size-4 text-gray-400" />
                  <div>
                    <span className="block font-medium text-gray-500">Target Account / Phone</span>
                    <span className="font-semibold text-royal-950 font-mono">{record.accountNumber || 'On file'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                  <MapPin className="size-4 text-gray-400" />
                  <div>
                    <span className="block font-medium text-gray-500">Sovereign Market Jurisdiction</span>
                    <span className="font-semibold text-royal-950">{record.marketName || record.countryCode}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Authorization Status" subtitle="Review and execution protocol">
              <div className="space-y-4 text-xs text-gray-600">
                <p>
                  Withdrawal requests require automated verification against the provider&apos;s escrow balances and banking rail confirmation before funds release.
                </p>
                <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                  <div className="flex items-center justify-between font-semibold text-royal-950">
                    <span>Payout Amount</span>
                    <span>{formatDisplayCurrency(record.amount, record.currency)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-gray-500">
                    <span>Current Pipeline Status</span>
                    <span className="font-medium capitalize">{record.status}</span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400">
                  Per Lé Inspa financial safety policies, withdrawal releases must never be performed via direct client database writes.
                </p>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </PageContainer>
  )
}
