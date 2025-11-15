import { 
  formatCurrency, 
  formatPercentage, 
  formatDate, 
  validateEmail,
  validateAmount,
  deepClone,
  debounce,
  throttle
} from '../../frontend/src/utils'

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format Indonesian Rupiah correctly', () => {
      expect(formatCurrency(1000000)).toBe('Rp 1.000.000')
      expect(formatCurrency(1500000)).toBe('Rp 1.500.000')
      expect(formatCurrency(0)).toBe('Rp 0')
    })

    it('should handle negative amounts', () => {
      expect(formatCurrency(-1000000)).toBe('-Rp 1.000.000')
    })

    it('should handle decimal amounts', () => {
      expect(formatCurrency(1000000.50)).toBe('Rp 1.000.000,50')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentages correctly', () => {
      expect(formatPercentage(0.95)).toBe('95%')
      expect(formatPercentage(0.1234)).toBe('12.34%')
      expect(formatPercentage(1)).toBe('100%')
    })

    it('should handle zero percentage', () => {
      expect(formatPercentage(0)).toBe('0%')
    })
  })

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      expect(formatDate(date)).toBe('15 Jan 2024')
    })

    it('should handle different date formats', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      expect(formatDate(date, 'short')).toBe('15/01/2024')
      expect(formatDate(date, 'long')).toBe('15 January 2024')
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
      expect(validateEmail('test+tag@example.org')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })
  })

  describe('validateAmount', () => {
    it('should validate positive amounts', () => {
      expect(validateAmount(1000)).toBe(true)
      expect(validateAmount(0)).toBe(true)
      expect(validateAmount(999999999)).toBe(true)
    })

    it('should reject negative amounts', () => {
      expect(validateAmount(-1000)).toBe(false)
    })

    it('should reject non-numeric values', () => {
      expect(validateAmount('abc')).toBe(false)
      expect(validateAmount(null)).toBe(false)
      expect(validateAmount(undefined)).toBe(false)
    })
  })

  describe('deepClone', () => {
    it('should clone simple objects', () => {
      const original = { a: 1, b: 2 }
      const cloned = deepClone(original)
      
      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
    })

    it('should clone nested objects', () => {
      const original = { 
        a: 1, 
        b: { c: 2, d: { e: 3 } } 
      }
      const cloned = deepClone(original)
      
      expect(cloned).toEqual(original)
      expect(cloned.b).not.toBe(original.b)
      expect(cloned.b.d).not.toBe(original.b.d)
    })

    it('should clone arrays', () => {
      const original = [1, 2, { a: 3 }]
      const cloned = deepClone(original)
      
      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
      expect(cloned[2]).not.toBe(original[2])
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should debounce function calls', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should throttle function calls', () => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 100)

      throttledFn()
      throttledFn()
      throttledFn()

      expect(mockFn).toHaveBeenCalledTimes(1)

      jest.advanceTimersByTime(100)
      throttledFn()
      expect(mockFn).toHaveBeenCalledTimes(2)
    })
  })
})
