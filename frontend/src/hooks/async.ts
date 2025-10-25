// ============================================================================
// ASYNC HOOKS - SINGLE SOURCE OF TRUTH
// ============================================================================

import { useState, useEffect, useCallback } from 'react'

export const useAsync = <T, E = string>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true
) => {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<E | null>(null)
  
  const execute = useCallback(async () => {
    setStatus('pending')
    setData(null)
    setError(null)
    
    try {
      const result = await asyncFunction()
      setData(result)
      setStatus('success')
    } catch (err) {
      setError(err as E)
      setStatus('error')
    }
  }, [asyncFunction])
  
  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])
  
  return { execute, status, data, error }
}

export const useFetch = <T>(
  url: string,
  options?: RequestInit
) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(url, options)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [url, options])
  
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  return { data, loading, error, refetch: fetchData }
}

export const useMutation = <T, V = any>(
  mutationFn: (variables: V) => Promise<T>
) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const mutate = useCallback(async (variables: V) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await mutationFn(variables)
      setData(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [mutationFn])
  
  return { mutate, data, loading, error }
}
