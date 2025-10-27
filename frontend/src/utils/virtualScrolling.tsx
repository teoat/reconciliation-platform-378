import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

// ============================================================================
// VIRTUAL SCROLLING UTILITIES
// ============================================================================

interface VirtualScrollConfig {
  itemHeight: number
  containerHeight: number
  overscan?: number
  threshold?: number
}

interface VirtualScrollState {
  scrollTop: number
  startIndex: number
  endIndex: number
  visibleItems: Array<{
    index: number
    top: number
    height: number
  }>
}

/**
 * Hook for virtual scrolling
 */
export function useVirtualScroll<T>(
  items: T[],
  config: VirtualScrollConfig
) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const { itemHeight, containerHeight, overscan = 5, threshold = 0.1 } = config

  const totalHeight = items.length * itemHeight
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    startIndex + visibleCount + overscan * 2
  )

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      index: startIndex + index,
      top: (startIndex + index) * itemHeight,
      height: itemHeight,
    }))
  }, [items, startIndex, endIndex, itemHeight])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    setScrollTop(target.scrollTop)
  }, [])

  const scrollToIndex = useCallback((index: number) => {
    if (containerRef.current) {
      const scrollTop = index * itemHeight
      containerRef.current.scrollTop = scrollTop
    }
  }, [itemHeight])

  const scrollToTop = useCallback(() => {
    scrollToIndex(0)
  }, [scrollToIndex])

  const scrollToBottom = useCallback(() => {
    scrollToIndex(items.length - 1)
  }, [scrollToIndex, items.length])

  return {
    containerRef,
    totalHeight,
    visibleItems,
    handleScroll,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    startIndex,
    endIndex,
  }
}

/**
 * Hook for virtual scrolling with dynamic item heights
 */
export function useDynamicVirtualScroll<T>(
  items: T[],
  config: Omit<VirtualScrollConfig, 'itemHeight'> & {
    getItemHeight: (item: T, index: number) => number
    estimatedItemHeight: number
  }
) {
  const [scrollTop, setScrollTop] = useState(0)
  const [itemHeights, setItemHeights] = useState<number[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const { containerHeight, overscan = 5, getItemHeight, estimatedItemHeight } = config

  // Calculate item heights
  useEffect(() => {
    const heights = items.map((item, index) => getItemHeight(item, index))
    setItemHeights(heights)
  }, [items, getItemHeight])

  // Calculate cumulative heights
  const cumulativeHeights = useMemo(() => {
    let cumulative = 0
    return itemHeights.map(height => {
      const result = cumulative
      cumulative += height
      return result
    })
  }, [itemHeights])

  const totalHeight = cumulativeHeights[cumulativeHeights.length - 1] + itemHeights[itemHeights.length - 1]

  // Find visible range
  const visibleRange = useMemo(() => {
    let startIndex = 0
    let endIndex = items.length - 1

    for (let i = 0; i < cumulativeHeights.length; i++) {
      if (cumulativeHeights[i] + itemHeights[i] >= scrollTop) {
        startIndex = Math.max(0, i - overscan)
        break
      }
    }

    for (let i = startIndex; i < cumulativeHeights.length; i++) {
      if (cumulativeHeights[i] >= scrollTop + containerHeight) {
        endIndex = Math.min(items.length - 1, i + overscan)
        break
      }
    }

    return { startIndex, endIndex }
  }, [scrollTop, containerHeight, cumulativeHeights, itemHeights, overscan, items.length])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => {
      const actualIndex = visibleRange.startIndex + index
      return {
        index: actualIndex,
        top: cumulativeHeights[actualIndex],
        height: itemHeights[actualIndex],
      }
    })
  }, [items, visibleRange, cumulativeHeights, itemHeights])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    setScrollTop(target.scrollTop)
  }, [])

  const scrollToIndex = useCallback((index: number) => {
    if (containerRef.current) {
      const scrollTop = cumulativeHeights[index]
      containerRef.current.scrollTop = scrollTop
    }
  }, [cumulativeHeights])

  return {
    containerRef,
    totalHeight,
    visibleItems,
    handleScroll,
    scrollToIndex,
    startIndex: visibleRange.startIndex,
    endIndex: visibleRange.endIndex,
  }
}

/**
 * Hook for infinite scrolling
 */
export function useInfiniteScroll<T>(
  items: T[],
  config: {
    threshold: number
    onLoadMore: () => void
    hasMore: boolean
    loading: boolean
  }
) {
  const [isNearBottom, setIsNearBottom] = useState(false)
  const { threshold, onLoadMore, hasMore, loading } = config

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const { scrollTop, scrollHeight, clientHeight } = target

    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    const nearBottom = distanceFromBottom < threshold

    setIsNearBottom(nearBottom)

    if (nearBottom && hasMore && !loading) {
      onLoadMore()
    }
  }, [threshold, onLoadMore, hasMore, loading])

  return {
    handleScroll,
    isNearBottom,
  }
}

/**
 * Hook for pagination
 */
export function usePagination<T>(
  items: T[],
  config: {
    pageSize: number
    initialPage?: number
  }
) {
  const { pageSize, initialPage = 1 } = config
  const [currentPage, setCurrentPage] = useState(initialPage)

  const totalPages = Math.ceil(items.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentItems = items.slice(startIndex, endIndex)

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  const goToFirstPage = useCallback(() => {
    goToPage(1)
  }, [goToPage])

  const goToLastPage = useCallback(() => {
    goToPage(totalPages)
  }, [goToPage, totalPages])

  return {
    currentPage,
    totalPages,
    currentItems,
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  }
}

/**
 * Hook for search and filtering
 */
export function useSearchAndFilter<T>(
  items: T[],
  config: {
    searchFields: (keyof T)[]
    searchTerm: string
    filters: Record<string, any>
    onSearchChange: (term: string) => void
    onFilterChange: (key: string, value: any) => void
  }
) {
  const { searchFields, searchTerm, filters, onSearchChange, onFilterChange } = config

  const filteredItems = useMemo(() => {
    let result = items

    // Apply search
    if (searchTerm) {
      result = result.filter(item =>
        searchFields.some(field => {
          const value = item[field]
          return value != null && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        })
      )
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        result = result.filter(item => {
          const itemValue = item[key as keyof T]
          return itemValue === value
        })
      }
    })

    return result
  }, [items, searchTerm, searchFields, filters])

  const clearFilters = useCallback(() => {
    Object.keys(filters).forEach(key => {
      onFilterChange(key, '')
    })
  }, [filters, onFilterChange])

  const clearSearch = useCallback(() => {
    onSearchChange('')
  }, [onSearchChange])

  const clearAll = useCallback(() => {
    clearSearch()
    clearFilters()
  }, [clearSearch, clearFilters])

  return {
    filteredItems,
    clearFilters,
    clearSearch,
    clearAll,
  }
}

/**
 * Hook for sorting
 */
export function useSorting<T>(
  items: T[],
  config: {
    sortField: keyof T
    sortDirection: 'asc' | 'desc'
    onSortChange: (field: keyof T, direction: 'asc' | 'desc') => void
  }
) {
  const { sortField, sortDirection, onSortChange } = config

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [items, sortField, sortDirection])

  const handleSort = useCallback((field: keyof T) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    onSortChange(field, newDirection)
  }, [sortField, sortDirection, onSortChange])

  return {
    sortedItems,
    handleSort,
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  useVirtualScroll,
  useDynamicVirtualScroll,
  useInfiniteScroll,
  usePagination,
  useSearchAndFilter,
  useSorting,
}
