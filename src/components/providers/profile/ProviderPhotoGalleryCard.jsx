import { Image as ImageIcon, AlertCircle, ChevronRight, CheckCircle2 } from 'lucide-react'

export function ProviderPhotoGalleryCard({
  profile,
  onOpenContentReview,
  onViewAllPhotos,
}) {
  if (!profile) return null

  const gallery = profile.gallery || {}
  const pending = gallery.pendingApproval || {}
  const hasPending = pending.hasPending

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <ImageIcon className="size-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              Provider Photo & Gallery
            </h3>
          </div>
          <button
            type="button"
            onClick={onViewAllPhotos}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 hover:bg-purple-50 px-2 py-1 rounded-md transition"
          >
            <span>View All</span>
            <ChevronRight className="size-3" />
          </button>
        </div>

        {/* Photos Grid Matching Screenshot */}
        <div className="mt-3 grid grid-cols-4 gap-2">
          {/* Main Large Portrait (spans 2 columns) */}
          <div className="col-span-2 relative h-32 rounded-xl overflow-hidden border border-slate-200 group">
            <img
              src={
                gallery.mainPhoto ||
                profile.avatar ||
                'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500'
              }
              alt="Main Provider Photo"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {hasPending && (
              <span className="absolute top-1.5 left-1.5 bg-amber-500/95 text-white text-[9.5px] font-bold px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-white animate-pulse" />
                Pending Review
              </span>
            )}
          </div>

          {/* Secondary Thumbnail 1 */}
          <div className="relative h-32 rounded-xl overflow-hidden border border-slate-200 group">
            <img
              src={
                gallery.thumbnails?.[0] ||
                'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'
              }
              alt="Gallery item 1"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Secondary Thumbnail 2 with '+12 Photos' Overlay */}
          <div
            onClick={onViewAllPhotos}
            className="relative h-32 rounded-xl overflow-hidden border border-slate-200 cursor-pointer group"
          >
            <img
              src={
                gallery.thumbnails?.[1] ||
                'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400'
              }
              alt="Gallery item 2"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex flex-col items-center justify-center text-white transition-colors group-hover:bg-slate-900/70">
              <span className="font-bold text-sm">+{gallery.totalCount ? gallery.totalCount - 3 : 12}</span>
              <span className="text-[10px] text-white/90 font-medium">Photos</span>
            </div>
          </div>
        </div>

        {/* Content Moderation Attention Banner */}
        {hasPending ? (
          <div className="mt-3 p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-6 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                <AlertCircle className="size-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11.5px] font-bold text-amber-950 truncate">
                  1 item awaiting approval
                </p>
                <p className="text-[10px] text-amber-800 truncate">
                  {pending.title || 'Profile photo submitted'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenContentReview}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-700 text-white text-[11px] font-semibold hover:bg-purple-800 transition shadow-xs"
            >
              <span>Review</span>
              <ChevronRight className="size-3" />
            </button>
          </div>
        ) : (
          <div className="mt-3 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span className="font-medium text-[11.5px]">All photos approved & compliant</span>
            </div>
            <button
              type="button"
              onClick={onOpenContentReview}
              className="text-[11px] font-semibold text-purple-700 hover:text-purple-900"
            >
              Review Queue
            </button>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="pt-3 border-t border-slate-100 mt-2">
        <button
          type="button"
          onClick={onOpenContentReview}
          className="w-full inline-flex items-center justify-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 transition py-1.5 rounded-lg hover:bg-purple-50"
        >
          <span>Open Content Moderation</span>
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

