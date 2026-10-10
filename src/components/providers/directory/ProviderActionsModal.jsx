import { useState } from 'react'
import { X, Ban, ShieldAlert, CheckCircle2, MessageSquare, AlertTriangle } from 'lucide-react'

export function ProviderActionsModal({ isOpen, provider, onClose, onActionComplete }) {
  const [actionType, setActionType] = useState('suspend')
  const [reason, setReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [done, setDone] = useState(false)

  if (!isOpen || !provider) return null

  const handleExecute = (e) => {
    e.preventDefault()
    setProcessing(true)
    setTimeout(() => {
      setProcessing(false)
      setDone(true)
      setTimeout(() => {
        setDone(false)
        onActionComplete?.(actionType, reason)
        onClose()
      }, 1000)
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Account Operations</h3>
            <p className="text-xs text-slate-500">
              Apply administrative action to {provider.name} ({provider.id})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-slate-900 text-sm">Action Applied Successfully</h4>
            <p className="text-xs text-slate-500">Provider status has been updated in the audit log.</p>
          </div>
        ) : (
          <form onSubmit={handleExecute} className="p-4 space-y-3.5 text-xs">
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">Select Administrative Action</label>
              <div className="space-y-1.5">
                {[
                  { id: 'suspend', label: 'Suspend Account Access', icon: Ban, color: 'text-rose-600' },
                  { id: 'review', label: 'Place Account Under Review', icon: ShieldAlert, color: 'text-amber-600' },
                  { id: 'message', label: 'Send Formal Compliance Notice', icon: MessageSquare, color: 'text-purple-600' },
                ].map((act) => {
                  const Icon = act.icon
                  const isSel = actionType === act.id
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setActionType(act.id)}
                      className={`w-full p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition ${
                        isSel
                          ? 'border-purple-600 bg-purple-50 text-purple-900 font-semibold ring-1 ring-purple-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${act.color}`} />
                      <span>{act.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Reason / Internal Audit Justification</label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State the administrative reason or incident ticket reference..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>All administrative interventions are recorded in the Lé Inspa security and compliance audit log.</span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className="px-4 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition disabled:opacity-50"
              >
                {processing ? 'Applying...' : 'Confirm Action'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

