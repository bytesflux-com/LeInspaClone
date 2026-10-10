import { Star, ChevronRight, MessageSquareQuote } from 'lucide-react'

export function ReviewsDistributionCard({
  profile,
  onViewAllReviews,
}) {
  if (!profile) return null

  const reviews = profile.reviews || {}
  const rating = reviews.rating ?? profile.rating ?? 4.9
  const reviewCount = reviews.reviewCount ?? profile.reviewCount ?? 126
  const distribution = reviews.distribution || [
    { stars: 5, percentage: 92 },
    { stars: 4, percentage: 6 },
    { stars: 3, percentage: 2 },
    { stars: 2, percentage: 0 },
    { stars: 1, percentage: 0 },
  ]
  const recentReview = reviews.recentReview || {
    clientName: 'James K.',
    rating: 5,
    date: '2 days ago',
    comment: 'Amazing experience! Very professional and skilled. Highly recommend.',
  }

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
              <Star className="size-4 fill-amber-400" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Reviews</h3>
          </div>
          <button
            type="button"
            onClick={onViewAllReviews}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 hover:bg-purple-50 px-2 py-1 rounded-md transition"
          >
            <span>View All</span>
            <ChevronRight className="size-3" />
          </button>
        </div>

        {/* Rating & Distribution Grid Matching Screenshot */}
        <div className="mt-3 grid grid-cols-12 gap-3 items-center">
          {/* Big Rating Block */}
          <div className="col-span-4 text-center border-r border-slate-100 pr-2">
            <p className="text-2xl font-black text-slate-900 leading-tight">
              {rating}
            </p>
            <div className="flex items-center justify-center gap-0.5 my-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className="size-3 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
            <p className="text-[10.5px] text-slate-500 font-medium">
              {reviewCount} reviews
            </p>
          </div>

          {/* Distribution Bars */}
          <div className="col-span-8 space-y-1">
            {distribution.map((item) => (
              <div key={item.stars} className="flex items-center gap-2 text-[10px]">
                <span className="w-4 text-slate-500 font-medium text-right">
                  {item.stars}★
                </span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="w-7 text-slate-400 font-medium text-right">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Review Snippet */}
        {recentReview && (
          <div className="mt-3 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <span className="size-5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold flex items-center justify-center">
                  {recentReview.clientName?.charAt(0) || 'J'}
                </span>
                <span>{recentReview.clientName}</span>
                <div className="flex items-center">
                  {[...Array(recentReview.rating || 5)].map((_, i) => (
                    <Star
                      key={i}
                      className="size-2.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
              </div>
              <span className="text-[10px] text-slate-400">
                {recentReview.date}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 italic line-clamp-2">
              "{recentReview.comment}"
            </p>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="pt-3 border-t border-slate-100 mt-2">
        <button
          type="button"
          onClick={onViewAllReviews}
          className="w-full inline-flex items-center justify-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 transition py-1.5 rounded-lg hover:bg-purple-50"
        >
          <span>View All Client Reviews</span>
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

