import { useState } from 'react'
import { X, Check, AlertTriangle, Image as ImageIcon, Send, ShieldCheck } from 'lucide-react'

const REASON_CODES = [
  { code: 'IMAGE_QUALITY', label: 'Image resolution too low or blurry' },
  { code: 'IMAGE_POLICY', label: 'Photo does not meet Lé Inspa professional standards' },
  { code: 'IMAGE_WATERMARK', label: 'Third-party watermarks or copyright overlay present' },
  { code: 'INCORRECT_CATEGORY', label: 'Image does not match service categorization' },
  { code: 'INSUFFICIENT_LIGHTING', label: 'Poor facial visibility or obstructive shadows' },
]

export function ContentModerationModal({
  isOpen,
  profile,
  onClose,
  onSubmitModeration,
  onShowToast,
}) {
  const [decision, setDecision] = useState(null) // 'approve' | 'reject'
  const [reasonCode, setReasonCode] = useState(REASON_CODES[1].code)
  const [adminNote, setAdminNote] = useState(
    'Photo does not meet Lé Inspa professional image standards. Please upload a high-resolution, well-lit portrait photo.'
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !profile) return null

  const pendingItem = profile.gallery?.pendingApproval || {
    previewUrl: profile.avatar,
    title: 'Profile photo submitted',
    submittedAt: '10 Sep 2026, 02:18 PM',
  }

  const selectedReason = REASON_CODES.find((r) => r.code === reasonCode)?.label || reasonCode

  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      await onSubmitModeration({
        itemId: 'profile_photo',
        itemType: 'photo',
        status: 'approved',
      })
      onShowToast?.('Content approved successfully')
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!reasonCode) return
    setIsSubmitting(true)
    try {
      await onSubmitModeration({
        itemId: 'profile_photo',
        itemType: 'photo',
        status: 'changes_requested',
        reasonCode,
        reasonLabel: selectedReason,
        adminNote,
      })
      onShowToast?.('Changes requested sent to provider')
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <X className="size-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
            <ImageIcon className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Review Provider Content
            </h3>
            <p className="text-xs text-slate-500">
              Provider: <strong className="text-slate-800">{profile.name}</strong> ({profile.id})
            </p>
          </div>
        </div>

        {/* Content Preview Container */}
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-center">
          <img
            src={
              pendingItem.previewUrl ||
              profile.avatar ||
              'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500'
            }
            alt="Submitted content preview"
            className="mx-auto max-h-52 object-cover rounded-lg"
          />
          <div className="p-2 text-[11px] text-slate-500 flex items-center justify-between px-3">
            <span>Item: Profile Photo</span>
            <span>Submitted: {pendingItem.submittedAt || '10 Sep 2026, 02:18 PM'}</span>
          </div>
        </div>

        {/* Content Moderation Status List */}
        <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
          <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-semibold text-[11px]">
            Photo: Pending
          </div>
          <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-[11px]">
            Gallery: Approved
          </div>
          <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-[11px]">
            Bio: Approved
          </div>
          <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-[11px]">
            Services: Approved
          </div>
        </div>

        {/* Decision Toggle */}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setDecision('approve')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold transition ${
              decision === 'approve'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Check className="size-4 text-emerald-600" />
            <span>Approve Content</span>
          </button>
          <button
            type="button"
            onClick={() => setDecision('reject')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold transition ${
              decision === 'reject'
                ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="size-4 text-rose-600" />
            <span>Request Changes</span>
          </button>
        </div>

        {/* Rejection / Request Changes Feedback Fields */}
        {decision === 'reject' && (
          <div className="mt-4 space-y-3 rounded-xl border border-rose-200 bg-rose-50/40 p-3.5 animate-in fade-in">
            <div>
              <label className="text-[11.5px] font-bold text-rose-950 block mb-1">
                Client-Facing Rejection Reason (Required)
              </label>
              <select
                value={reasonCode}
                onChange={(e) => {
                  setReasonCode(e.target.value)
                  const match = REASON_CODES.find((r) => r.code === e.target.value)
                  if (match) setAdminNote(match.label)
                }}
                className="w-full rounded-lg border border-rose-200 bg-white p-2 text-xs text-slate-800 focus:outline-hidden"
              >
                {REASON_CODES.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11.5px] font-bold text-rose-950 block mb-1">
                Admin Note to Provider (Optional feedback note)
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                placeholder="Give clear guidance so the provider can promptly resubmit compliant content..."
                className="w-full rounded-lg border border-rose-200 bg-white p-2 text-xs text-slate-800 focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="mt-5 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          {decision === 'approve' && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleApprove}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              <Check className="size-3.5" />
              <span>{isSubmitting ? 'Approving...' : 'Confirm Approval'}</span>
            </button>
          )}
          {decision === 'reject' && (
            <button
              type="button"
              disabled={isSubmitting || !reasonCode}
              onClick={handleReject}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50 transition"
            >
              <Send className="size-3.5" />
              <span>{isSubmitting ? 'Sending Request...' : 'Send Changes Request'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

