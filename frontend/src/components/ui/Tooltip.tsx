import React, { useState, useRef, useEffect, memo } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

/**
 * Tooltip Component
 * Accessible tooltip with proper ARIA attributes
 *
 * @param children - Element that triggers the tooltip
 * @param content - Tooltip content
 * @param position - Tooltip position (top, bottom, left, right)
 * @param delay - Delay before showing tooltip (ms)
 * @param id - Optional ID for the tooltip
 */
export interface TooltipProps {
  children: React.ReactElement;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  id?: string;
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = memo(
  ({ children, content, position = 'top', delay = 300, id, disabled = false }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const tooltipId = id || `tooltip-${Math.random().toString(36).substr(2, 9)}`;
    const triggerId = `tooltip-trigger-${tooltipId}`;

    useEffect(() => {
      if (disabled) return;

      if (isHovered || isFocused) {
        timeoutRef.current = setTimeout(() => {
          setIsVisible(true);
        }, delay);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
      }

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [isHovered, isFocused, delay, disabled]);

    const positionClasses = {
      top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    };

    const arrowClasses = {
      top: 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-900',
      bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-900',
      left: 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-900',
      right: 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-900',
    };

    return (
      <div className="relative inline-block">
        {React.cloneElement(children, {
          id: triggerId,
          'aria-describedby': tooltipId,
          'aria-label': typeof content === 'string' ? content : undefined,
          onMouseEnter: () => setIsHovered(true),
          onMouseLeave: () => setIsHovered(false),
          onFocus: () => setIsFocused(true),
          onBlur: () => setIsFocused(false),
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === 'Escape') {
              setIsVisible(false);
              setIsHovered(false);
              setIsFocused(false);
            }
          },
        })}

        {isVisible && (
          <div
            id={tooltipId}
            role="tooltip"
            className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg ${positionClasses[position]} pointer-events-none`}
            aria-live="polite"
            aria-atomic="true"
          >
            {content}
            <div
              className={`absolute w-0 h-0 border-4 border-transparent ${arrowClasses[position]}`}
              aria-hidden="true"
            />
          </div>
        )}
      </div>
    );
  }
);

Tooltip.displayName = 'Tooltip';

export default Tooltip;
