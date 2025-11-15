import { useEffect, useRef, RefObject } from 'react'

/**
 * Hook for restoring focus to a previously focused element
 * Useful after closing modals, dropdowns, or other temporary components
 * 
 * @param isActive - Whether to save/restore focus
 * @param restoreOnUnmount - Whether to restore focus when component unmounts (default: true)
 * 
 * @example
 * ```tsx
 * const { saveFocus, restoreFocus } = useFocusRestore(isOpen)
 * 
 * useEffect(() => {
 *   if (isOpen) {
 *     saveFocus()
 *   } else {
 *     restoreFocus()
 *   }
 * }, [isOpen])
 * ```
 */
export const useFocusRestore = (
  isActive: boolean = true,
  restoreOnUnmount: boolean = true
): {
  saveFocus: () => void
  restoreFocus: () => void
  savedFocus: RefObject<HTMLElement | null>
} => {
  const savedFocusRef = useRef<HTMLElement | null>(null)

  const saveFocus = () => {
    savedFocusRef.current = document.activeElement as HTMLElement
  }

  const restoreFocus = () => {
    if (savedFocusRef.current) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        savedFocusRef.current?.focus()
        savedFocusRef.current = null
      }, 0)
    }
  }

  // Save focus when active
  useEffect(() => {
    if (isActive) {
      saveFocus()
    }
  }, [isActive])

  // Restore focus on unmount if enabled
  useEffect(() => {
    if (!restoreOnUnmount) {
      return
    }

    return () => {
      restoreFocus()
    }
  }, [restoreOnUnmount])

  return {
    saveFocus,
    restoreFocus,
    savedFocus: savedFocusRef as React.RefObject<HTMLElement | null>,
  }
}

