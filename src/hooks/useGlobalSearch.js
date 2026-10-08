import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { searchService } from '../services/searchService'
import { useMarketContext } from './useMarketContext'

export function useGlobalSearch() {
  const { selectedMarket } = useMarketContext()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialQuery = searchParams.get('q') || 'Grace Njeri'
  const initialCategory = searchParams.get('category') || 'all'
  const initialSort = searchParams.get('sort') || 'relevance'

  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState(initialCategory)
  const [sortBy, setSortBy] = useState(initialSort)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [recentSearches, setRecentSearches] = useState([])

  // Load recent searches
  useEffect(() => {
    setRecentSearches(searchService.getRecentSearches())
  }, [])

  // Execute search
  const performSearch = useCallback(
    async (targetQuery, targetCategory, targetSort) => {
      try {
        setLoading(true)
        setError(null)
        const res = await searchService.search({
          query: targetQuery,
          category: targetCategory,
          marketId: selectedMarket.id,
          sortBy: targetSort,
        })
        setData(res)

        if (targetQuery && targetQuery.trim()) {
          searchService.addRecentSearch(targetQuery)
          setRecentSearches(searchService.getRecentSearches())
        }
      } catch (err) {
        console.error('[useGlobalSearch] Search failed:', err)
        setError(err?.message || 'Search service temporarily unavailable')
      } finally {
        setLoading(false)
      }
    },
    [selectedMarket.id],
  )

  // Trigger search on parameter changes
  useEffect(() => {
    performSearch(query, category, sortBy)
  }, [query, category, sortBy, performSearch])

  // Sync with URL query parameters
  const updateQuery = (newQuery) => {
    setQuery(newQuery)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (newQuery) next.set('q', newQuery)
      else next.delete('q')
      return next
    })
  }

  const updateCategory = (newCat) => {
    setCategory(newCat)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('category', newCat)
      return next
    })
  }

  const updateSortBy = (newSort) => {
    setSortBy(newSort)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('sort', newSort)
      return next
    })
  }

  const clearRecent = () => {
    searchService.clearRecentSearches()
    setRecentSearches([])
  }

  return {
    query,
    setQuery: updateQuery,
    category,
    setCategory: updateCategory,
    sortBy,
    setSortBy: updateSortBy,
    data,
    loading,
    error,
    refetch: () => performSearch(query, category, sortBy),
    recentSearches,
    clearRecent,
    selectedMarket,
  }
}

