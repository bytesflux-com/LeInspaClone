import { useEffect, useState, useCallback } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import {
  ArrowLeft,
  BadgeCheck,
  Building,
  CheckCircle2,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  User,
  XCircle,
} from 'lucide-react'
import PageContainer from '../../components/layout/PageContainer'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import CountryFlag from '../../components/ui/CountryFlag'
import ErrorState from '../../components/ui/ErrorState'
import LoadingState from '../../components/ui/LoadingState'
import Notice from '../../components/ui/Notice'
import { usePermissions } from '../../hooks/usePermissions'
import { PERMISSIONS } from '../../constants/permissions'
import { attentionService } from '../../services/attentionService'

export default function VerificationDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { can } = usePermissions()

  const canVerify = can(PERMISSIONS.PROVIDERS_VERIFY)
  const returnTo = searchParams.get('returnTo') || 'attention'
  const marketParam = searchParams.get('market') || 'ALL'
  const tabParam = searchParams.get('tab') || 'verification'

  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Action dialog states
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionSuccessMessage, setActionSuccessMessage] = useState('')

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
        sourceType: 'user_verification',
        sourceId: id,
        marketId: marketParam,
      })
      setRecord(data)
    } catch (err) {
      setError(err?.message || 'Failed to load provider verification record.')
      setRecord(null)
    } finally {
      setLoading(false)
    }
  }, [id, marketParam])

  useEffect(() => {
    fetchRecord()
  }, [fetchRecord])

  const handleApprove = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const result = await attentionService.processReviewAction({
        sourceType: 'user_verification',
        sourceId: id,
        action: 'approve',
      })
      setShowApproveDialog(false)
      setActionSuccessMessage(result?.message || 'Provider verification approved successfully.')
      await fetchRecord()
    } catch (err) {
      setError(err?.message || 'Failed to approve verification. Check permissions and session validity.')
      setShowApproveDialog(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason || rejectionReason.trim().length < 3) {
      setReasonError('Please provide a specific rejection reason (at least 3 characters).')
      return
    }

    setSubmitting(true)
    setError(null)
    setReasonError('')
    try {
      const result = await attentionService.processReviewAction({
        sourceType: 'user_verification',
        sourceId: id,
        action: 'reject',
        reason: rejectionReason.trim(),
      })
      setShowRejectDialog(false)
      setRejectionReason('')
      setActionSuccessMessage(result?.message || 'Provider verification rejected.')
      await fetchRecord()
    } catch (err) {
      setError(err?.message || 'Failed to reject verification. Check permissions and session validity.')
      setShowRejectDialog(false)
    } finally {
      setSubmitting(false)
    }
  }

  const statusVariant =
    record?.status === 'verified'
      ? 'success'
      : record?.status === 'rejected'
        ? 'danger'
        : 'warning'

  return (
    <PageContainer>
      {/* Breadcrumb & Navigation Header */}
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
            <span className="font-semibold text-gray-900">Provider Verification</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-royal-950 sm:text-3xl">
            Provider Verification Review
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

      {loading ? <LoadingState message="Loading verification record…" /> : null}

      {!loading && error ? (
        <ErrorState
          title="Unable to load record"
          description={error}
          onRetry={fetchRecord}
          className="my-6"
        />
      ) : null}

      {!loading && record ? (
        <div className="space-y-6">
          {actionSuccessMessage && (
            <Notice tone="success" title="Action Completed">
              {actionSuccessMessage}
            </Notice>
          )}

          {record.isMock && (
            <Notice tone="attention" title="Development Simulation Mode Active">
              This record is loaded from the development mock fixture dataset. Real backend operations are simulated in memory.
            </Notice>
          )}

          {/* Provider Overview Header Card */}
          <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-royal-50 text-royal-700 ring-1 ring-royal-200">
                  <BadgeCheck className="size-7" />
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
                    <span className="capitalize">{record.accountType?.replaceAll('_', ' ')}</span>
                    {record.submittedAt && (
                      <>
                        <span>•</span>
                        <span>Submitted {new Date(record.submittedAt).toLocaleDateString()}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Buttons for Pending State */}
              {record.status === 'pending' && canVerify ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="danger"
                    size="md"
                    icon={XCircle}
                    onClick={() => {
                      setReasonError('')
                      setShowRejectDialog(true)
                    }}
                    disabled={submitting}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    icon={CheckCircle2}
                    onClick={() => setShowApproveDialog(true)}
                    disabled={submitting}
                  >
                    Approve Verification
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Detailed Verification Information Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Contact & Account Credentials */}
            <Card title="Provider Details" subtitle="Contact and profile information">
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                  <User className="size-4 text-gray-400" />
                  <div>
                    <span className="block font-medium text-gray-500">Applicant Name</span>
                    <span className="font-semibold text-royal-950">{record.title}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                  <Mail className="size-4 text-gray-400" />
                  <div>
                    <span className="block font-medium text-gray-500">Email Address</span>
                    <span className="font-semibold text-royal-950">{record.email || 'Not provided'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                  <Phone className="size-4 text-gray-400" />
                  <div>
                    <span className="block font-medium text-gray-500">Phone Number</span>
                    <span className="font-semibold text-royal-950">{record.phone || 'Not provided'}</span>
                  </div>
                </div>

                {record.businessName && (
                  <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                    <Building className="size-4 text-gray-400" />
                    <div>
                      <span className="block font-medium text-gray-500">Business / Spa Name</span>
                      <span className="font-semibold text-royal-950">{record.businessName}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                  <MapPin className="size-4 text-gray-400" />
                  <div>
                    <span className="block font-medium text-gray-500">Authorized Sovereign Market</span>
                    <span className="font-semibold text-royal-950">{record.marketName || record.countryCode}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Verification Documents & Credentials */}
            <Card
              title="Submitted Documents"
              subtitle="Verification credentials submitted by the provider"
              className="lg:col-span-2"
            >
              {Array.isArray(record.documents) && record.documents.length > 0 ? (
                <div className="space-y-3">
                  {record.documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 transition hover:bg-gray-100/60"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-royal-100 text-royal-800">
                          <FileText className="size-4.5" />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-royal-950">{doc.name || `Document ${idx + 1}`}</p>
                          <p className="text-[11px] text-gray-500 capitalize">{doc.type || 'Identity & License Credential'}</p>
                        </div>
                      </div>

                      {doc.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-royal-700 shadow-2xs hover:bg-gray-50"
                        >
                          <span>View Document</span>
                          <ExternalLink className="size-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] font-medium text-gray-400">File attached</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500">
                  <FileText className="mx-auto size-8 text-gray-300" />
                  <p className="mt-2 font-medium">Standard KYC Application</p>
                  <p className="mt-1 text-gray-400">Profile credentials uploaded during registration.</p>
                </div>
              )}

              {/* Status and Audit History Box */}
              <div className="mt-6 border-t border-gray-100 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Status & Audit Trail</h4>
                {record.status === 'verified' && (
                  <div className="mt-2 rounded-xl bg-emerald-50/70 border border-emerald-200 p-3.5 text-xs text-emerald-900">
                    <p className="font-semibold">✓ Account Professionally Verified</p>
                    <p className="mt-1 text-[11px] text-emerald-700">
                      Verified at {record.verifiedAt ? new Date(record.verifiedAt).toLocaleString() : 'recently'}
                      {record.verifiedBy ? ` by Administrator ${record.verifiedBy}` : ''}
                    </p>
                  </div>
                )}

                {record.status === 'rejected' && (
                  <div className="mt-2 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-900">
                    <p className="font-bold">✗ Verification Rejected</p>
                    {record.rejectionReason && (
                      <p className="mt-1 text-xs font-medium text-rose-800">
                        Reason: {record.rejectionReason}
                      </p>
                    )}
                    <p className="mt-1.5 text-[11px] text-rose-600">
                      Processed at {record.rejectedAt ? new Date(record.rejectedAt).toLocaleString() : 'recently'}
                      {record.rejectedBy ? ` by Administrator ${record.rejectedBy}` : ''}
                    </p>
                  </div>
                )}

                {record.status === 'pending' && (
                  <div className="mt-2 text-xs text-gray-500">
                    This account is currently awaiting verification review.
                    {!canVerify && (
                      <p className="mt-1 text-amber-700 font-medium">
                        Your admin role has view-only access. Only administrators with the `providers.verify` permission can approve or reject records.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {/* Confirmation Modal: Approve */}
      {showApproveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
              <CheckCircle2 className="size-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-royal-950">Approve Provider Verification</h3>
            <p className="mt-2 text-xs leading-relaxed text-gray-600">
              Approving this provider will activate their professional status in {record?.marketName || 'the assigned market'} and enable them to accept customer bookings. This action will be recorded in the security audit log.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowApproveDialog(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleApprove}
                loading={submitting}
                loadingText="Approving…"
              >
                Confirm Approval
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal: Reject with mandatory reason */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex size-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-200">
              <ShieldAlert className="size-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-royal-950">Reject Provider Verification</h3>
            <p className="mt-2 text-xs leading-relaxed text-gray-600">
              Please state why this verification is being rejected. This reason is required and will be logged in the permanent audit trail.
            </p>

            <div className="mt-4 space-y-1">
              <label htmlFor="rejectionReason" className="text-xs font-semibold text-gray-700">
                Rejection Reason <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="rejectionReason"
                rows={3}
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value)
                  if (reasonError) setReasonError('')
                }}
                placeholder="e.g. Incomplete license documents or expired national ID…"
                className="w-full rounded-xl border border-gray-300 p-3 text-xs text-gray-900 shadow-2xs focus:border-royal-500 focus:outline-none focus:ring-1 focus:ring-royal-500"
              />
              {reasonError && <p className="text-[11px] font-semibold text-rose-600">{reasonError}</p>}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowRejectDialog(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleReject}
                loading={submitting}
                loadingText="Rejecting…"
              >
                Reject Application
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
