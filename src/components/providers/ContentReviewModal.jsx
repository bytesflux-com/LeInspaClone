import { useState } from 'react'
import { X, Check, AlertTriangle, Image as ImageIcon, Send } from 'lucide-react'
import { useAdminSession } from '../../hooks/useAdminSession'

const REASONS = [
  { code: 'IMAGE_QUALITY', label: 'Image resolution too low or blurry' },
  { code: 'IMAGE_POLICY', label: 'Photo does not meet Lé Inspa professional image standards' },
  { code: 'IMAGE_WATERMARK', label: 'Watermark or third-party logo present' },
  { code: 'INCORRECT_CATEGORY', label: 'Content does not match service categorization' },
  { code: 'INSUFFICIENT_INFO', label: 'Incomplete business or credentials description' },
]

export default function ContentReviewModal({ isOpen, onClose, onActionComplete }) {
  const { admin } = useAdminSession()
  const [activeItem, setActiveItem] = useState({
    id: 'cnt-841',
    provider: 'Grace Njeri',
    type: 'Profile Photo',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80',
    submittedAt: '12 Sep 2026, 09:30',
  })
  const [decision, setDecision] = useState(null) // 'approve' | 'reject'
  const [reasonCode, setReasonCode] = useState(REASONS[1].code)
  const [adminNote, setAdminNote] = useState(
    'Photo does not meet Lé Inspa professional image standards. Please upload a clear professional photo.'
  )
  const [busy, setBusy] = useState(false)

  if (!isOpen) return null

  const handleApprove = () => {
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      onActionComplete?.({
        itemId: activeItem.id,
        action: 'approved',
        reviewedBy: admin?.name || 'Admin',
        reviewedAt: new Date().toISOString(),
      })
      onClose()
    }, 400)
  }

  const handleReject = () => {
    if (!adminNote) return
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      onActionComplete?.({
        itemId: activeItem.id,
        action: 'changes_requested',
        reasonCode,
        adminNote,
        reviewedBy: admin?.name || 'Admin',
        reviewedAt: new Date().toISOString(),
      })
      onClose()
    }, 400)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="size-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-[#5c2dd5]">
            <ImageIcon className="size-5" />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-[#1b1140]">Review Content</h3>
            <p className="text-[12px] text-gray-500">
              Provider: <strong className="text-[#1b1140]">{activeItem.provider}</strong> ({activeItem.type})
            </p>
          </div>
        </div>

        {/* Preview Container */}
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 text-center">
          <img
            src={activeItem.url}
            alt="Submitted content"
            className="mx-auto max-h-56 object-cover"
          />
          <div className="p-2 text-[11px] text-gray-400">
            Submitted: {activeItem.submittedAt}
          </div>
        </div>

        {/* Decision Toggle / Options */}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setDecision('approve')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-[13px] font-semibold transition ${
              decision === 'approve'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Check className="size-4 text-emerald-600" /> Approve Content
          </button>
          <button
            type="button"
            onClick={() => setDecision('reject')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-[13px] font-semibold transition ${
              decision === 'reject'
                ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle className="size-4 text-rose-600" /> Request Changes
          </button>
        </div>

        {/* Rejection / Changes Note */}
        {decision === 'reject' && (
          <div className="mt-4 space-y-3 rounded-xl border border-rose-100 bg-rose-50/40 p-3.5">
            <div>
              <label className="text-[11.5px] font-semibold text-rose-900">
                Reason Code
              </label>
              <select
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
                className="mt-1 w-full rounded-lg border border-rose-200 bg-white p-2 text-[12px] text-gray-800"
              >
                {REASONS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11.5px] font-semibold text-rose-900">
                Feedback Note to Provider (Required)
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                placeholder="Explain the required change..."
                className="mt-1 w-full rounded-lg border border-rose-200 bg-white p-2 text-[12px] text-gray-800"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-[12px] font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          {decision === 'approve' && (
            <button
              type="button"
              disabled={busy}
              onClick={handleApprove}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-[12px] font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
            >
              <Check className="size-3.5" /> Confirm Approval
            </button>
          )}
          {decision === 'reject' && (
            <button
              type="button"
              disabled={busy || !adminNote}
              onClick={handleReject}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-[12px] font-semibold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50"
            >
              <Send className="size-3.5" /> Send Changes Request
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

