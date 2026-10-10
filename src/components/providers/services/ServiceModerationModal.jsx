import { useState } from 'react'
import {
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'

const MODERATION_REASONS = [
  { code: 'IMAGE_QUALITY', label: 'Image Quality Below Standards / Watermarked' },
  { code: 'INACCURATE_DESC', label: 'Misleading or Inaccurate Service Description' },
  { code: 'UNUSUAL_PRICE_SURGE', label: 'Price Change Exceeds Allowed Variance or Policy' },
  { code: 'OUT_OF_SCOPE', label: 'Service Scope Incompatible with Selected Category' },
  { code: 'POLICY_VIOLATION', label: 'Terms of Service / Safety Guideline Violation' },
  { code: 'OTHER', label: 'Other Regulatory / Quality Review Flag' },
]

export function ServiceModerationModal({
  isOpen,
  onClose,
  service,
  onModerate, // ({ action, reasonCode, reasonLabel, messageToProvider, adminNote })
  onSuccess,
}) {
  const [selectedAction, setSelectedAction] = useState('approve') // 'approve', 'request_changes', 'reject'
  const [reasonCode, setReasonCode] = useState(MODERATION_REASONS[0].code)
  const [messageToProvider, setMessageToProvider] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen || !service) return null

  const proposed = service.proposedChanges || {}
  const hasDescriptionChange = proposed.newDescription && proposed.newDescription !== service.description
  const hasImageChange = proposed.newImage && proposed.newImage !== service.image
  const hasPriceChange = proposed.newPrice && proposed.newPrice !== service.price

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (selectedAction !== 'approve' && !messageToProvider.trim()) {
      setError('A message to the provider explaining the decision is required.')
      return
    }

    setIsSubmitting(true)
    try {
      const selectedReason = MODERATION_REASONS.find((r) => r.code === reasonCode)
      await onModerate({
        serviceId: service.id || service.serviceId,
        action: selectedAction,
        reasonCode: selectedAction === 'approve' ? null : reasonCode,
        reasonLabel: selectedAction === 'approve' ? null : selectedReason?.label,
        messageToProvider: selectedAction === 'approve' ? '' : messageToProvider.trim(),
        adminNote: adminNote.trim(),
      })
      onSuccess?.(
        selectedAction === 'approve'
          ? `Service "${service.name}" approved successfully.`
          : selectedAction === 'request_changes'
          ? `Changes requested for "${service.name}". Notification sent to provider.`
          : `Proposed update for "${service.name}" rejected.`
      )
      onClose()
    } catch (err) {
      console.error('[ServiceModerationModal] Submit error:', err)
      setError(err?.message || 'Failed to submit moderation review.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Service Content Review</h3>
              <p className="text-xs text-slate-500">
                Review provider submissions and verify compliance with Lé Inspa standards.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
              <XCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Service Snapshot Card */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-purple-50/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-purple-700 uppercase">
                Service Under Review
              </span>
              <h4 className="font-bold text-slate-900 text-sm">{service.name}</h4>
              <p className="font-mono text-[11px] text-slate-500">
                {service.serviceId || service.id} • Category: {service.category || 'Massage'}
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-slate-900 text-sm">
                {service.price}
              </span>
              <p className="text-[10.5px] text-slate-400">{service.duration || '60 min'}</p>
            </div>
          </div>

          {/* Comparison / Proposed Changes */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>Proposed Changes by Provider</span>
              <span className="size-1.5 rounded-full bg-amber-500" />
            </h4>

            {/* Description Diff */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-100/75 px-3 py-1.5 font-bold text-[11px] text-slate-700 border-b border-slate-200 flex items-center justify-between">
                <span>Description Diff</span>
                {hasDescriptionChange && (
                  <span className="text-[10px] text-amber-700 font-semibold bg-amber-100/70 px-2 py-0.5 rounded-full">
                    Changed
                  </span>
                )}
              </div>
              <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                <div className="p-3 space-y-1 bg-slate-50/50">
                  <span className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">
                    Current Approved
                  </span>
                  <p className="text-slate-600 leading-relaxed text-xs">
                    {service.description || 'No description provided.'}
                  </p>
                </div>
                <div className="p-3 space-y-1 bg-amber-50/40">
                  <span className="text-[10.5px] font-semibold text-amber-800 uppercase tracking-wider">
                    Proposed Update
                  </span>
                  <p className="text-slate-800 leading-relaxed text-xs font-medium">
                    {proposed.newDescription ||
                      'Focused myofascial release targeting deep muscular adhesions and trigger points. Includes organic lavender oil aromatherapy finish.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Images Diff (if proposed) */}
            {hasImageChange && (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-100/75 px-3 py-1.5 font-bold text-[11px] text-slate-700 border-b border-slate-200">
                  Hero Image Diff
                </div>
                <div className="grid sm:grid-cols-2 p-3 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10.5px] font-semibold text-slate-500">Current</span>
                    <img
                      src={service.image}
                      alt="Current"
                      className="w-full h-28 object-cover rounded-lg border border-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10.5px] font-semibold text-amber-800">Proposed New</span>
                    <img
                      src={proposed.newImage}
                      alt="Proposed"
                      className="w-full h-28 object-cover rounded-lg border border-amber-300"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Price Diff (if proposed) */}
            {hasPriceChange && (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-100/75 px-3 py-1.5 font-bold text-[11px] text-slate-700 border-b border-slate-200">
                  Price Diff
                </div>
                <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                  <div className="p-3 space-y-1 bg-slate-50/50">
                    <span className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">
                      Current Approved
                    </span>
                    <p className="font-mono font-bold text-slate-900 text-sm">
                      {service.price}
                    </p>
                  </div>
                  <div className="p-3 space-y-1 bg-amber-50/40">
                    <span className="text-[10.5px] font-semibold text-amber-800 uppercase tracking-wider">
                      Proposed Price
                    </span>
                    <p className="font-mono font-bold text-amber-800 text-sm">
                      {proposed.newPrice}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Selector */}
          <div className="space-y-2">
            <label className="font-bold text-slate-900 block text-xs">Moderation Decision</label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedAction('approve')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-center ${
                  selectedAction === 'approve'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
              >
                <CheckCircle2 className={`size-5 ${selectedAction === 'approve' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-xs">Approve Changes</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAction('request_changes')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-center ${
                  selectedAction === 'request_changes'
                    ? 'border-amber-500 bg-amber-50 text-amber-800 font-bold ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
              >
                <AlertTriangle className={`size-5 ${selectedAction === 'request_changes' ? 'text-amber-600' : 'text-slate-400'}`} />
                <span className="text-xs">Request Changes</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAction('reject')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-center ${
                  selectedAction === 'reject'
                    ? 'border-rose-500 bg-rose-50 text-rose-800 font-bold ring-2 ring-rose-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
              >
                <XCircle className={`size-5 ${selectedAction === 'reject' ? 'text-rose-600' : 'text-slate-400'}`} />
                <span className="text-xs">Reject Update</span>
              </button>
            </div>
          </div>

          {/* Conditional inputs for Request Changes / Reject */}
          {selectedAction !== 'approve' && (
            <div className="space-y-3.5 p-3.5 rounded-xl border border-amber-200 bg-amber-50/30">
              {/* Reason Selector */}
              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Primary Reason <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className="w-full text-xs rounded-lg border-slate-300 bg-white py-2 px-2.5 focus:border-purple-500 focus:ring-purple-500"
                >
                  {MODERATION_REASONS.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message to Provider */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800">
                    Message to Provider <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Visible in Provider Portal</span>
                </div>
                <textarea
                  rows={3}
                  value={messageToProvider}
                  onChange={(e) => setMessageToProvider(e.target.value)}
                  placeholder="Explain clearly what needs correction before this service can be approved..."
                  className="w-full text-xs rounded-lg border-slate-300 bg-white p-2.5 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              {/* Internal Admin Note */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800">Internal Admin Note</label>
                  <span className="text-[10px] text-slate-400">Internal only • Hidden from provider</span>
                </div>
                <textarea
                  rows={2}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Optional internal logging or auditor notes..."
                  className="w-full text-xs rounded-lg border-slate-300 bg-white p-2.5 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
          )}

          {/* Notice Banner */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2 text-[11px] text-slate-600">
            <HelpCircle className="size-4 shrink-0 text-slate-400 mt-0.5" />
            <span>
              {selectedAction === 'approve'
                ? 'Approving will immediately replace the public service information in the client mobile booking app.'
                : 'Current public information remains active while the provider resolves change requests.'}
            </span>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 rounded-xl text-white font-semibold transition flex items-center gap-1.5 shadow-xs ${
                selectedAction === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : selectedAction === 'request_changes'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isSubmitting ? (
                <span>Processing...</span>
              ) : (
                <>
                  <span>
                    {selectedAction === 'approve'
                      ? 'Confirm Approval'
                      : selectedAction === 'request_changes'
                      ? 'Send Change Request'
                      : 'Confirm Rejection'}
                  </span>
                  <ArrowRight className="size-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
