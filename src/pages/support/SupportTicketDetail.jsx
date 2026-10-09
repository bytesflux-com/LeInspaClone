import { useEffect, useState, useCallback } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import {
  ArrowLeft,
  Headphones,
  Mail,
  MapPin,
  MessageSquare,
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

export default function SupportTicketDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()

  const returnTo = searchParams.get('returnTo') || 'attention'
  const marketParam = searchParams.get('market') || 'ALL'
  const tabParam = searchParams.get('tab') || 'support'

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
        sourceType: 'support_ticket',
        sourceId: id,
        marketId: marketParam,
      })
      setRecord(data)
    } catch (err) {
      setError(err?.message || 'Failed to load support ticket details.')
      setRecord(null)
    } finally {
      setLoading(false)
    }
  }, [id, marketParam])

  useEffect(() => {
    fetchRecord()
  }, [fetchRecord])

  const statusVariant =
    record?.status === 'resolved' || record?.status === 'closed'
      ? 'success'
      : record?.status === 'open'
        ? 'royal'
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
            <span className="font-semibold text-gray-900">Support Ticket</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-royal-950 sm:text-3xl">
            Support Concierge Ticket Review
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

      {loading ? <LoadingState message="Loading support ticket…" /> : null}

      {!loading && error ? (
        <ErrorState
          title="Unable to load ticket"
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
                <span className="flex size-14 items-center justify-center rounded-2xl bg-royal-50 text-royal-800 ring-1 ring-royal-200">
                  <Headphones className="size-7" />
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
                    <span>Ticket ID: {record.sourceId}</span>
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

          <Notice tone="attention" title="Support Concierge Dispatch">
            {record.unsupportedReason ||
              'Support ticket replies and escalation actions require the concierge messaging service.'}
          </Notice>

          {/* Ticket Information & Thread Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card title="Requester Information" subtitle="User and account information">
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                  <User className="size-4 text-gray-400" />
                  <div>
                    <span className="block font-medium text-gray-500">User / Customer ID</span>
                    <span className="font-semibold text-royal-950 font-mono">
                      {record.userId || 'Client ID on file'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                  <Mail className="size-4 text-gray-400" />
                  <div>
                    <span className="block font-medium text-gray-500">Subject</span>
                    <span className="font-semibold text-royal-950">{record.subject}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                  <MapPin className="size-4 text-gray-400" />
                  <div>
                    <span className="block font-medium text-gray-500">Jurisdiction</span>
                    <span className="font-semibold text-royal-950">{record.marketName || record.countryCode}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card
              title="Ticket Conversation Thread"
              subtitle="Logged correspondence for this case"
              className="lg:col-span-2"
            >
              {Array.isArray(record.messages) && record.messages.length > 0 ? (
                <div className="space-y-3">
                  {record.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-gray-100 bg-gray-50/70 p-4"
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500">
                        <span>{msg.sender || 'Client'}</span>
                        <span>{msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ''}</span>
                      </div>
                      <p className="mt-2 text-xs text-gray-800 leading-relaxed">
                        {msg.text || msg.body}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-xs text-gray-500">
                  <MessageSquare className="mx-auto size-8 text-gray-300" />
                  <p className="mt-2 font-medium">Inquiry Logged</p>
                  <p className="mt-1 text-gray-400">Customer opened support request regarding service inquiry.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : null}
    </PageContainer>
  )
}
