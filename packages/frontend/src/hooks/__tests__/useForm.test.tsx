import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useForm } from '../../hooks/useForm'

describe('useForm Hook', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useForm({
      initialValues: { name: 'John', email: 'john@example.com' }
    }))

    expect(result.current.values).toEqual({ name: 'John', email: 'john@example.com' })
    expect(result.current.errors).toEqual({})
    expect(result.current.touched).toEqual({})
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.isValid).toBe(true)
  })

  it('should handle field changes', () => {
    const { result } = renderHook(() => useForm())

    act(() => {
      result.current.handleChange('name', 'Jane')
    })

    expect(result.current.values.name).toBe('Jane')
  })

  it('should validate required fields', () => {
    const { result } = renderHook(() => useForm({
      validationRules: {
        name: { required: true },
        email: { required: true, email: true }
      }
    }))

    act(() => {
      result.current.handleBlur('name')
    })

    expect(result.current.errors.name).toBe('This field is required')
    expect(result.current.touched.name).toBe(true)
  })

  it('should validate email format', () => {
    const { result } = renderHook(() => useForm({
      validationRules: {
        email: { email: true }
      }
    }))

    act(() => {
      result.current.handleChange('email', 'invalid-email')
      result.current.handleBlur('email')
    })

    expect(result.current.errors.email).toBe('Invalid email address')
  })

  it('should validate minimum length', () => {
    const { result } = renderHook(() => useForm({
      validationRules: {
        password: { minLength: 8 }
      }
    }))

    act(() => {
      result.current.handleChange('password', '123')
      result.current.handleBlur('password')
    })

    expect(result.current.errors.password).toBe('Minimum length is 8 characters')
  })

  it('should validate maximum length', () => {
    const { result } = renderHook(() => useForm({
      validationRules: {
        description: { maxLength: 100 }
      }
    }))

    act(() => {
      result.current.handleChange('description', 'a'.repeat(101))
      result.current.handleBlur('description')
    })

    expect(result.current.errors.description).toBe('Maximum length is 100 characters')
  })

  it('should validate custom rules', () => {
    const { result } = renderHook(() => useForm({
      validationRules: {
        age: { 
          custom: (value) => {
            if (value < 18) return 'Must be at least 18 years old'
            return null
          }
        }
      }
    }))

    act(() => {
      result.current.handleChange('age', '16')
      result.current.handleBlur('age')
    })

    expect(result.current.errors.age).toBe('Must be at least 18 years old')
  })

  it('should clear errors when field value changes', () => {
    const { result } = renderHook(() => useForm({
      validationRules: {
        name: { required: true }
      }
    }))

    // First, create an error
    act(() => {
      result.current.handleBlur('name')
    })
    expect(result.current.errors.name).toBe('This field is required')

    // Then, fix the error by providing a value
    act(() => {
      result.current.handleChange('name', 'John')
    })
    expect(result.current.errors.name).toBeUndefined()
  })

  it('should handle form submission', async () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useForm({
      initialValues: { name: 'John', email: 'john@example.com' },
      onSubmit
    }))

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(onSubmit).toHaveBeenCalledWith({ name: 'John', email: 'john@example.com' })
  })

  it('should not submit if validation fails', async () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useForm({
      validationRules: {
        name: { required: true }
      },
      onSubmit
    }))

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(onSubmit).not.toHaveBeenCalled()
    expect(result.current.errors.name).toBe('This field is required')
  })

  it('should reset form to initial values', () => {
    const { result } = renderHook(() => useForm({
      initialValues: { name: 'John', email: 'john@example.com' }
    }))

    // Change values
    act(() => {
      result.current.handleChange('name', 'Jane')
      result.current.handleChange('email', 'jane@example.com')
    })

    expect(result.current.values.name).toBe('Jane')
    expect(result.current.values.email).toBe('jane@example.com')

    // Reset form
    act(() => {
      result.current.reset()
    })

    expect(result.current.values.name).toBe('John')
    expect(result.current.values.email).toBe('john@example.com')
    expect(result.current.errors).toEqual({})
    expect(result.current.touched).toEqual({})
  })

  it('should set individual field errors', () => {
    const { result } = renderHook(() => useForm())

    act(() => {
      result.current.setError('name', 'Custom error message')
    })

    expect(result.current.errors.name).toBe('Custom error message')
  })

  it('should clear individual field errors', () => {
    const { result } = renderHook(() => useForm())

    // Set an error
    act(() => {
      result.current.setError('name', 'Custom error message')
    })
    expect(result.current.errors.name).toBe('Custom error message')

    // Clear the error
    act(() => {
      result.current.clearError('name')
    })
    expect(result.current.errors.name).toBeUndefined()
  })
})
