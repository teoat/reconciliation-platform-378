// Service Utilities
export const retry = async <T>(
  fn: () => Promise<T>,
  attempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === attempts - 1) throw error
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
  throw new Error('Retry failed')
}

export const timeout = <T>(
  promise: Promise<T>,
  ms: number
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), ms)
    )
  ])
}

export const createError = (code: string, message: string, details?: unknown) => ({
  code,
  message,
  details,
  timestamp: new Date().toISOString()
})

export const createSuccess = <T = unknown>(code: string, message: string, data?: T) => ({
  code,
  message,
  data,
  timestamp: new Date().toISOString()
})

