import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  title: string
  description?: string
  variant: 'success' | 'error' | 'warning' | 'info'
  action?: {
    labelayload: string
    onClick: () => void
  }
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  
  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])
  
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])
  
  return { toasts, showToast, dismissToast }
}

