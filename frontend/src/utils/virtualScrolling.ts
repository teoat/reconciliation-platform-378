/**
 * Virtual Scrolling Utility
 * Lightweight virtual scrolling implementation for large lists
 */

import { useState, useMemo, useCallback } from 'react';

export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export interface VirtualItem {
  index: number;
  top: number;
  height: number;
}

export interface VirtualScrollResult {
  visibleItems: VirtualItem[];
  totalHeight: number;
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

/**
 * Custom hook for virtual scrolling
 */
export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
): VirtualScrollResult {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
  }, []);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight)
    );

    const visibleItems: VirtualItem[] = [];
    const start = Math.max(0, startIndex - overscan);
    const end = Math.min(items.length - 1, endIndex + overscan);

    for (let i = start; i <= end; i++) {
      visibleItems.push({
        index: i,
        top: i * itemHeight,
        height: itemHeight,
      });
    }

    return visibleItems;
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  return {
    visibleItems,
    totalHeight,
    handleScroll,
  };
}
