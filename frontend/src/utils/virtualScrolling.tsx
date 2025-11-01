// ============================================================================
// VIRTUAL SCROLLING UTILITIES - SINGLE SOURCE OF TRUTH
// ============================================================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface VirtualScrollItem {
  id: string | number
  height?: number
  data: any
}

export interface VirtualScrollProps {
  items: VirtualScrollItem[]
  itemHeight: number
  containerHeight: number
  overscan?: number
  threshold?: number
  renderItem: (item: VirtualScrollItem, index: number) => React.ReactNode
  onScroll?: (scrollTop: number) => void
  className?: string
  style?: React.CSSProperties
}

export interface VirtualScrollState {
  scrollTop: number
  visibleStart: number
  visibleEnd: number
  totalHeight: number
  offsetY: number
}

// ============================================================================
// VIRTUAL SCROLLING HOOK
// ============================================================================

export const useVirtualScrolling = (
  items: VirtualScrollItem[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5,
  _threshold: number = 0.05
) => {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight)
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    )
    const visibleStart = Math.max(0, start - overscan)
    const visibleEnd = Math.min(items.length, end)

    return {
      visibleStart,
      visibleEnd,
      totalHeight: items.length * itemHeight,
      offsetY: visibleStart * itemHeight,
    }
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length])

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement
    setScrollTop(target.scrollTop)
  }, [])

  // Scroll to specific item
  const scrollToItem = useCallback((index: number) => {
    if (containerRef.current) {
      const scrollTop = index * itemHeight
      containerRef.current.scrollTop = scrollTop
    }
  }, [itemHeight])

  // Scroll to top
  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
    }
  }, [])

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [])

  return {
    containerRef,
    scrollTop,
    visibleRange,
    handleScroll,
    scrollToItem,
    scrollToTop,
    scrollToBottom,
  }
}

// ============================================================================
// VIRTUAL SCROLLING COMPONENT
// ============================================================================

export const VirtualScrolling: React.FC<VirtualScrollProps> = ({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
  threshold = 0.05,
  renderItem,
  onScroll,
  className = '',
  style = {},
}) => {
  const {
    containerRef,
    scrollTop,
    visibleRange,
    handleScroll,
  } = useVirtualScrolling(items, itemHeight, containerHeight, overscan, threshold)

  // Handle scroll with callback
  const handleScrollWithCallback = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    handleScroll(event)
    onScroll?.(scrollTop)
  }, [handleScroll, onScroll, scrollTop])

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.visibleStart, visibleRange.visibleEnd)
  }, [items, visibleRange.visibleStart, visibleRange.visibleEnd])

  return (
    <div
      ref={containerRef}
      className={`virtual-scroll-container ${className}`}
      style={{
        height: containerHeight,
        overflow: 'auto',
        ...style,
      }}
      onScroll={handleScrollWithCallback}
    >
      {/* Spacer for total height */}
      <div
        style={{
          height: visibleRange.totalHeight,
          position: 'relative',
        }}
      >
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${visibleRange.offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={item.id}
              style={{
                height: itemHeight,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {renderItem(item, visibleRange.visibleStart + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// DYNAMIC HEIGHT VIRTUAL SCROLLING
// ============================================================================

export interface DynamicVirtualScrollProps extends Omit<VirtualScrollProps, 'itemHeight'> {
  getItemHeight: (item: VirtualScrollItem, index: number) => number
  estimatedItemHeight: number
}

export const DynamicVirtualScrolling: React.FC<DynamicVirtualScrollProps> = ({
  items,
  getItemHeight,
  estimatedItemHeight,
  containerHeight,
  overscan = 5,
  renderItem,
  onScroll,
  className = '',
  style = {},
}) => {
  const [scrollTop, setScrollTop] = useState(0)
  const [itemHeights, setItemHeights] = useState<number[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate item heights
  useEffect(() => {
    const heights = items.map((item, index) => getItemHeight(item, index))
    setItemHeights(heights)
  }, [items, getItemHeight])

  // Calculate cumulative heights
  const cumulativeHeights = useMemo(() => {
    const cumulative: number[] = [0]
    for (let i = 0; i < itemHeights.length; i++) {
      cumulative.push(cumulative[i] + itemHeights[i])
    }
    return cumulative
  }, [itemHeights])

  // Calculate visible range
  const visibleRange = useMemo(() => {
    let start = 0
    let end = items.length

    // Find start index
    for (let i = 0; i < cumulativeHeights.length - 1; i++) {
      if (cumulativeHeights[i + 1] > scrollTop) {
        start = Math.max(0, i - overscan)
        break
      }
    }

    // Find end index
    const visibleHeight = containerHeight + scrollTop
    for (let i = start; i < cumulativeHeights.length - 1; i++) {
      if (cumulativeHeights[i + 1] > visibleHeight) {
        end = Math.min(items.length, i + overscan + 1)
        break
      }
    }

    return {
      visibleStart: start,
      visibleEnd: end,
      totalHeight: cumulativeHeights[cumulativeHeights.length - 1],
      offsetY: cumulativeHeights[start],
    }
  }, [scrollTop, containerHeight, overscan, items.length, cumulativeHeights])

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement
    setScrollTop(target.scrollTop)
    onScroll?.(target.scrollTop)
  }, [onScroll])

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.visibleStart, visibleRange.visibleEnd)
  }, [items, visibleRange.visibleStart, visibleRange.visibleEnd])

  return (
    <div
      ref={containerRef}
      className={`dynamic-virtual-scroll-container ${className}`}
      style={{
        height: containerHeight,
        overflow: 'auto',
        ...style,
      }}
      onScroll={handleScroll}
    >
      {/* Spacer for total height */}
      <div
        style={{
          height: visibleRange.totalHeight,
          position: 'relative',
        }}
      >
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${visibleRange.offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.visibleStart + index
            const height = itemHeights[actualIndex] || estimatedItemHeight
            
            return (
              <div
                key={item.id}
                style={{
                  height,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {renderItem(item, actualIndex)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// INFINITE SCROLLING HOOK
// ============================================================================

export interface InfiniteScrollProps {
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  threshold?: number
  rootMargin?: string
}

export const useInfiniteScroll = ({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 0.1,
  rootMargin = '100px',
}: InfiniteScrollProps) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasMore || isLoading) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        if (entry.isIntersecting && hasMore && !isLoading) {
          onLoadMore()
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    observerRef.current = observer

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, isLoading, onLoadMore, threshold, rootMargin])

  return {
    elementRef,
    isIntersecting,
  }
}

// ============================================================================
// INFINITE SCROLLING COMPONENT
// ============================================================================

export interface InfiniteScrollComponentProps extends InfiniteScrollProps {
  children: React.ReactNode
  loadingComponent?: React.ReactNode
  endComponent?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export const InfiniteScrollComponent: React.FC<InfiniteScrollComponentProps> = ({
  children,
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 0.1,
  rootMargin = '100px',
  loadingComponent,
  endComponent,
  className = '',
  style = {},
}) => {
  const { elementRef } = useInfiniteScroll({
    hasMore,
    isLoading,
    onLoadMore,
    threshold,
    rootMargin,
  })

  return (
    <div className={`infinite-scroll-container ${className}`} style={style}>
      {children}
      
      {/* Loading indicator */}
      {isLoading && (
        loadingComponent || (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )
      )}
      
      {/* End indicator */}
      {!hasMore && !isLoading && (
        endComponent || (
          <div className="text-center p-4 text-gray-500">
            No more items to load
          </div>
        )
      )}
      
      {/* Intersection observer target */}
      <div ref={elementRef} style={{ height: '1px' }} />
    </div>
  )
}

// ============================================================================
// EXPORT ALL VIRTUAL SCROLLING UTILITIES
// ============================================================================

export default {
  useVirtualScrolling,
  VirtualScrolling,
  DynamicVirtualScrolling,
  useInfiniteScroll,
  InfiniteScrollComponent,
}
