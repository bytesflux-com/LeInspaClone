import PageContainer from '../../components/layout/PageContainer'
import { useGlobalSearch } from '../../hooks/useGlobalSearch'
import SearchHeader from '../../components/search/SearchHeader'
import SearchInputBar from '../../components/search/SearchInputBar'
import CategoryFilterTabs from '../../components/search/CategoryFilterTabs'
import ExactMatchBanner from '../../components/search/ExactMatchBanner'
import SearchResultsSection from '../../components/search/SearchResultsSection'
import {
  RecentSearchesCard,
  QuickAccessCard,
  SearchTipsCard,
  SearchPromotionBanner,
} from '../../components/search/SearchSidebarWidgets'
import Skeleton from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import { useMarketContext } from '../../hooks/useMarketContext'

function SearchSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading search results">
      <Skeleton className="h-12 w-full rounded-2xl" />
      <Skeleton className="h-10 w-3/4 rounded-xl" />
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
        <div className="w-full lg:w-80 space-y-4">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

// ADM-007 — Universal Global Search Orchestrator
export default function GlobalSearchPage() {
  const {
    query,
    setQuery,
    category,
    setCategory,
    sortBy,
    setSortBy,
    data,
    loading,
    error,
    refetch,
    recentSearches,
    clearRecent,
    selectedMarket,
  } = useGlobalSearch()

  const { setSelectedMarket, markets } = useMarketContext()

  const handleResetToAllMarkets = () => {
    const allMarket = markets.find((m) => m.id === 'ALL') || { id: 'ALL', name: 'All Markets' }
    setSelectedMarket(allMarket)
  }

  return (
    <PageContainer wide={true}>
      <SearchHeader />

      {/* Large Search Input Field & Controls */}
      <SearchInputBar
        query={query}
        onSearch={setQuery}
        selectedMarket={selectedMarket}
        onResetMarket={selectedMarket?.id !== 'ALL' ? handleResetToAllMarkets : null}
        onToggleFilters={() => {}}
      />

      {/* Horizontally Scrollable Category Filter Tabs */}
      <CategoryFilterTabs
        activeCategory={category}
        onSelectCategory={setCategory}
        counts={data?.counts}
      />

      {/* Error State */}
      {error && !data && (
        <ErrorState
          title="Search Service Offline"
          description={error}
          onRetry={refetch}
        />
      )}

      {/* Loading Skeleton */}
      {loading && !data && <SearchSkeleton />}

      {/* Search Content */}
      {data && (
        <div className="space-y-6">
          {/* Smart Exact-Match Highlighted Banner (if platform ID detected) */}
          {data.exactMatch && <ExactMatchBanner match={data.exactMatch} />}

          {/* Main 2-Column Search Workspace */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left: Results Grouped by Entity */}
            <div className="flex-1 min-w-0 w-full">
              <SearchResultsSection
                query={query}
                data={data}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onSelectCategory={setCategory}
                selectedMarket={selectedMarket}
              />
            </div>

            {/* Right: Sidebar with Recent Searches, Quick Access & Tips */}
            <div className="w-full lg:w-72 xl:w-80 2xl:w-[340px] shrink-0 space-y-4">
              <RecentSearchesCard
                items={recentSearches}
                onSelectRecent={setQuery}
                onClearRecent={clearRecent}
              />
              <QuickAccessCard />
              <SearchTipsCard />
              <SearchPromotionBanner />
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}

