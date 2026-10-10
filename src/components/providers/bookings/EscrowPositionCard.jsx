import { Shield, ChevronRight, CheckCircle2, Clock, AlertTriangle, RotateCcw } from 'lucide-react'

export function EscrowPositionCard({
  escrowPositions,
  canSeeFinancial = true,
  onShowToast,
}) {
  const e = escrowPositions || {}

  const fmt = (val) =>
    canSeeFinancial ? (typeof val === 'number' ? `KES ${val.toLocaleString()}` : val || 'KES —') : 'KES —'

  const tiles = [
    {
      id: 'held',
      label: 'Held',
      value: fmt(e.held ?? 98200),
      icon: Clock,
      color: 'text-purple-700',
      bgColor: 'bg-purple-100',
    },
    {
      id: 'released',
      label: 'Released',
      value: fmt(e.released ?? 870300),
      icon: CheckCircle2,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-100',
    },
    {
      id: 'disputed',
      label: 'Disputed',
      value: fmt(e.disputed ?? 12000),
      icon: AlertTriangle,
      color: 'text-amber-700',
      bgColor: 'bg-amber-100',
    },
    {
      id: 'refunded',
      label: 'Refunded',
      value: fmt(e.refunded ?? 15500),
      icon: RotateCcw,
      color: 'text-rose-700',
      bgColor: 'bg-rose-100',
    },
  ]

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Shield className="size-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Escrow Position</h3>
          </div>

          <button
            type="button"
            onClick={() => onShowToast?.('Navigating to Shared Escrow Custody Hub')}
            className="text-xs font-semibold text-purple-700 hover:underline flex items-center gap-0.5"
          >
            <span>View Escrow</span>
            <ChevronRight className="size-3" />
          </button>
        </div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3 pt-3">
          {tiles.map((tile) => {
            const Icon = tile.icon
            return (
              <div
                key={tile.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5"
              >
                <div className="flex items-center gap-1.5">
                  <div
                    className={`size-5 rounded-full ${tile.bgColor} ${tile.color} flex items-center justify-center shrink-0`}
                  >
                    <Icon className="size-3" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600">{tile.label}</span>
                </div>
                <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm block">
                  {tile.value}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

