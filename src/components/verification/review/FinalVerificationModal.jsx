import { useState } from 'react'
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Award,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'

/**
 * ADM-031: FinalVerificationModal
 * Final verification sign-off dialog summarizing all checks before setting provider to VERIFIED.
 */
export default function FinalVerificationModal({
  isOpen,
  onClose,
  onConfirm,
  record,
  submitting = false,
}) {
  const [confirmed, setConfirmed] = useState(false)

  if (!isOpen || !record) return null

  const steps = record.progressSteps || [
    { label: 'Identity Verification', status: 'APPROVED' },
    { label: 'Professional Credentials', status: 'APPROVED' },
    { label: 'Profile Information', status: 'APPROVED' },
    { label: 'Final Verification', status: 'APPROVED' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-emerald-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Complete Verification & Grant Verified Status
              </h3>
              <p className="text-xs text-slate-500">
                Final compliance sign-off for {record.name} ({record.providerId})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="size-5" />
          </button>
        </header>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4">
            <div className="flex items-center gap-3">
              <img
                src={record.avatarUrl}
                alt={record.name}
                className="size-11 rounded-full border border-emerald-300 object-cover shadow-2xs"
              />
              <div>
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{record.name}</span>
                  <span className="text-blue-500 text-xs">✓</span>
                </h4>
                <p className="text-xs text-slate-600">
                  {record.type} • {record.market?.name || 'Kenya'} {record.market?.flag || '🇰🇪'}
                </p>
              </div>
            </div>
          </div>

          {/* Checklist Summary */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Verification Components Summary
            </h5>
            <div className="rounded-xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden">
              {steps.map((st, i) => (
                <div key={i} className="flex items-center justify-between p-3 text-xs bg-white">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="font-medium text-slate-800">{st.label}</span>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    APPROVED
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-2.5 rounded-xl border border-purple-200/80 bg-purple-50/50 p-3.5 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-[#6D28D9] focus:ring-purple-500"
            />
            <span className="text-xs text-slate-700 leading-snug">
              I certify that all identification documents, professional credentials, and regulatory checks
              have been thoroughly examined and verified in compliance with Lé Inspa platform policy.
            </span>
          </label>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50/80 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!confirmed || submitting}
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40 transition"
          >
            <span>{submitting ? 'Granting Verified Status...' : 'Confirm & Grant Verified Status'}</span>
            <ArrowRight className="size-3.5" />
          </button>
        </footer>
      </div>
    </div>
  )
}
