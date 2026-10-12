import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { providerTrustService } from '../../services/providerTrustService'
import { useProviderTrustData, useTrustContext } from '../../hooks/useProviderTrust'
import ErrorState from '../../components/ui/ErrorState'
import { PageSkeleton, ProviderTrustHeader } from '../../components/providers/trust/TrustUI'
import { useToast } from '../../components/providers/trust/useTrustToast'
import { ReviewOverview, ReviewPerformance, TopReviewedServices } from '../../components/providers/reviews/ReviewOverview'
import { ReviewsTable } from '../../components/providers/reviews/ReviewsTable'
import { ReviewDetailPanel } from '../../components/providers/reviews/ReviewDetailPanel'

const DEFAULT_FILTERS = { tab: 'all', search: '', rating: 'all', dateRange: 'all', status: 'all', bookingVerified: 'all', hasMedia: 'all', hasResponse: 'all', page: 1, pageSize: 10 }

// ADM-025 — Provider Reviews (REUSE / ADMIN VIEW over the shared review system).
// Read → Verify → Contextualize → Decide → Record.
export default function ProviderReviews() {
  const { providerId: routeId } = useParams()
  const providerId = routeId || 'PR-82941'
  // Keyed by provider so filters and selection reset when switching providers.
  return <ReviewsScreen key={providerId} providerId={providerId} />
}

function ReviewsScreen({ providerId }) {
  const toast = useToast()
  const ctx = useTrustContext()

  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [search, setSearch] = useState('')
  const setFilter = useCallback((patch) => {
    if ('search' in patch) setSearch(patch.search)
    setFilters((f) => ({ ...f, ...patch }))
  }, [])
  // Debounce only the search box; other filters apply immediately.
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250)
    return () => clearTimeout(t)
  }, [search])
  const query = useMemo(() => ({ ...filters, search: debounced }), [filters, debounced])

  const list = useProviderTrustData((c) => providerTrustService.getReviews(providerId, query, c), `${providerId}|${JSON.stringify(query)}`)

  // undefined = follow the default (newest review on wide screens); null = closed by the admin.
  const [chosenId, setSelectedId] = useState(undefined)
  const [wide] = useState(() => window.matchMedia('(min-width: 1280px)').matches)
  const firstId = list.data?.items?.[0]?.id
  const selectedId = chosenId === undefined ? (wide ? firstId || null : null) : chosenId
  const [detailNonce, setDetailNonce] = useState(0)
  const detail = useProviderTrustData(
    (c) => (selectedId ? providerTrustService.getReviewDetail(providerId, selectedId, c) : Promise.resolve(null)),
    `${providerId}|${selectedId}|${detailNonce}`,
  )


  const moderate = async (input) => {
    const res = await providerTrustService.moderateReview(providerId, { reviewId: selectedId, ...input }, ctx)
    toast.show(res?.message || 'Decision recorded')
    list.refetch()
    setDetailNonce((n) => n + 1)
  }

  const data = list.data
  const provider = data ? { ...data.provider, reviewTotal: data.overview.totalReviews, rating: data.overview.averageRating ?? data.provider.rating } : null
  const canModerate = Boolean(data?.permissions?.moderateReviews)

  if (list.error && !data) {
    return (
      <div className="mx-auto mt-10 max-w-xl px-4">
        <ErrorState title="Unable to load provider reviews" description={list.error} onRetry={list.refetch} />
      </div>
    )
  }

  const panel = (
    <ReviewDetailPanel
      detail={detail.data}
      loading={detail.loading || detail.fetching}
      error={detail.error}
      onClose={() => setSelectedId(null)}
      onModerate={moderate}
      canModerate={canModerate}
      providerName={provider?.name}
    />
  )

  return (
    <div className="min-h-full bg-lavender-50/60">
      <div className={`grid gap-4 p-3.5 sm:p-5 ${selectedId ? 'xl:grid-cols-[minmax(0,1fr)_380px]' : ''}`}>
        <div className="min-w-0 space-y-4">
          <ProviderTrustHeader provider={provider} providerId={providerId} section="Reviews" sectionPath="reviews" isMock={providerTrustService.isMock} onCopy={toast.show} />
          {!data ? (
            <PageSkeleton />
          ) : (
            <>
              <ReviewOverview overview={data.overview} distribution={data.distribution} />
              <ReviewsTable data={data} filters={{ ...filters, search }} setFilter={setFilter} selectedId={selectedId} onSelect={setSelectedId} fetching={list.fetching} />
              <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
                <ReviewPerformance performance={data.performance} />
                <TopReviewedServices services={data.topServices} onFilter={(name) => setFilter({ search: name, tab: 'all', page: 1 })} />
              </div>
              {data.truncated && <p className="text-[11px] text-amber-700">Showing the most recent records only — this provider has more reviews than a single load returns.</p>}
            </>
          )}
        </div>

        {selectedId && (
          <>
            <aside className="sticky top-3 hidden max-h-[calc(100vh-1.5rem)] self-start overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card xl:flex xl:flex-col">{panel}</aside>
            <div className="fixed inset-0 z-[60] flex justify-end xl:hidden">
              <button type="button" aria-label="Close" className="absolute inset-0 bg-royal-950/30" onClick={() => setSelectedId(null)} />
              <aside className="relative flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl">{panel}</aside>
            </div>
          </>
        )}
      </div>
      {toast.node}
    </div>
  )
}
