import { Sparkles, ChevronRight, Clock } from 'lucide-react'

export function ActiveServicesCard({
  profile,
  onViewAllServices,
}) {
  if (!profile) return null

  const services = profile.services || []
  const previewServices = services.slice(0, 3)

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Sparkles className="size-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              Active Services ({services.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={onViewAllServices}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 hover:bg-purple-50 px-2 py-1 rounded-md transition"
          >
            <span>View All</span>
            <ChevronRight className="size-3" />
          </button>
        </div>

        {/* Table / List Preview */}
        <div className="mt-2 divide-y divide-slate-100 text-xs">
          {/* Table Header */}
          <div className="grid grid-cols-12 py-2 text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
            <div className="col-span-6">Service</div>
            <div className="col-span-2 text-center">Duration</div>
            <div className="col-span-2 text-right">Price (KES)</div>
            <div className="col-span-2 text-right">Status</div>
          </div>

          {/* Service Rows */}
          {previewServices.map((srv) => (
            <div
              key={srv.id}
              className="grid grid-cols-12 items-center py-2.5 hover:bg-slate-50/60 rounded-lg px-1 transition"
            >
              {/* Service Name + Thumbnail */}
              <div className="col-span-6 flex items-center gap-2.5 min-w-0 pr-2">
                <img
                  src={
                    srv.image ||
                    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=120'
                  }
                  alt={srv.name}
                  className="size-8 rounded-lg object-cover shrink-0 border border-slate-200"
                />
                <span className="font-semibold text-slate-800 truncate text-[11.5px]">
                  {srv.name}
                </span>
              </div>

              {/* Duration */}
              <div className="col-span-2 text-center text-slate-500 font-medium text-[11px]">
                {srv.duration}
              </div>

              {/* Price */}
              <div className="col-span-2 text-right font-bold text-slate-900 text-[11.5px]">
                {typeof srv.price === 'string'
                  ? srv.price.replace('KES ', '')
                  : srv.price?.toLocaleString()}
              </div>

              {/* Status */}
              <div className="col-span-2 text-right">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="size-1 rounded-full bg-emerald-500" />
                  {srv.status || 'Active'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-3 border-t border-slate-100 mt-2">
        <button
          type="button"
          onClick={onViewAllServices}
          className="w-full inline-flex items-center justify-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 transition py-1.5 rounded-lg hover:bg-purple-50"
        >
          <span>View All Services</span>
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

