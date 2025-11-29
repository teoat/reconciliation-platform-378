// ============================================================================
// USE FORM HOOK TESTS
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useForm } from '../useForm';
import type { ValidationRules } from '../useForm';

vi.mock('@/services/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('useForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useForm());

    expect(result.current.values).toEqual({});
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should initialize with provided initial values', () => {
    const initialValues = { name: 'John', email: 'john@example.com' };
    const { result } = renderHook(() => useForm({ initialValues }));

    expect(result.current.values).toEqual(initialValues);
  });

  describe('setValue', () => {
    it('should set a value', () => {
      const { result } = renderHook(() => useForm());

      act(() => {
        result.current.setValue('name', 'John');
      });

      expect(result.current.values.name).toBe('John');
    });

    it('should clear error when setting value', () => {
      const { result } = renderHook(() => useForm());

      act(() => {
        result.current.setError('name', 'Required');
        result.current.setValue('name', 'John');
      });

      expect(result.current.errors.name).toBeUndefined();
    });
  });

  describe('validation', () => {
    it('should validate required field', () => {
      const validationRules: ValidationRules = {
        name: { required: true },
      };
      const { result } = renderHook(() => useForm({ validationRules }));

      act(() => {
        result.current.handleBlur('name');
      });

      expect(result.current.errors.name).toBe('This field is required');
    });

    it('should validate minLength', () => {
      const validationRules: ValidationRules = {
        password: { minLength: 8 },
      };
      const { result } = renderHook(() => useForm({ validationRules }));

      act(() => {
        result.current.setValue('password', 'short');
        result.current.handleBlur('password');
      });

      expect(result.current.errors.password).toBe('Minimum length is 8 characters');
    });

    it('should validate maxLength', () => {
      const validationRules: ValidationRules = {
        name: { maxLength: 10 },
      };
      const { result } = renderHook(() => useForm({ validationRules }));

      act(() => {
        result.current.setValue('name', 'Very Long Name');
        result.current.handleBlur('name');
      });

      expect(result.current.errors.name).toBe('Maximum length is 10 characters');
    });

    it('should validate email format', () => {
      const validationRules: ValidationRules = {
        email: { email: true },
      };
      const { result } = renderHook(() => useForm({ validationRules }));

      act(() => {
        result.current.setValue('email', 'invalid-email');
        result.current.handleBlur('email');
      });

      expect(result.current.errors.email).toBe('Invalid email address');
    });

    it('should validate pattern', () => {
      const validationRules: ValidationRules = {
        phone: { pattern: /^\d{10}$/ },
      };
      const { result } = renderHook(() => useForm({ validationRules }));

      act(() => {
        result.current.setValue('phone', '123');
        result.current.handleBlur('phone');
      });

      expect(result.current.errors.phone).toBe('Invalid format');
    });

    it('should validate custom validator', () => {
      const validationRules: ValidationRules = {
        age: {
          custom: (value) => {
            if (typeof value === 'number' && value < 18) {
              return 'Must be 18 or older';
            }
            return null;
          },
        },
      };
      const { result } = renderHook(() => useForm({ validationRules }));

      act(() => {
        result.current.setValue('age', 16);
        result.current.handleBlur('age');
      });

      expect(result.current.errors.age).toBe('Must be 18 or older');
    });
  });

  describe('handleBlur', () => {
    it('should mark field as touched', () => {
      const { result } = renderHook(() => useForm());

      act(() => {
        result.current.handleBlur('name');
      });

      expect(result.current.touched.name).toBe(true);
    });

    it('should validate field on blur', () => {
      const validationRules: ValidationRules = {
        name: { required: true },
      };
      const { result } = renderHook(() => useForm({ validationRules }));

      act(() => {
        result.current.handleBlur('name');
      });

      expect(result.current.errors.name).toBe('This field is required');
    });
  });

  describe('handleSubmit', () => {
    it('should call onSubmit when form is valid', async () => {
      const onSubmit = vi.fn();
      const initialValues = { name: 'John', email: 'john@example.com' };
      const { result } = renderHook(() =>
        useForm({ initialValues, onSubmit })
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(onSubmit).toHaveBeenCalledWith(initialValues);
    });

    it('should not call onSubmit when form is invalid', async () => {
      const onSubmit = vi.fn();
      const validationRules: ValidationRules = {
        name: { required: true },
      };
      const { result } = renderHook(() =>
        useForm({ validationRules, onSubmit })
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched on submit', async () => {
      const validationRules: ValidationRules = {
        name: { required: true },
        email: { required: true },
      };
      const { result } = renderHook(() => useForm({ validationRules }));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.touched.name).toBe(true);
      expect(result.current.touched.email).toBe(true);
    });

    it('should set isSubmitting during submission', async () => {
      const onSubmit = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 100)));
      const { result } = renderHook(() => useForm({ onSubmit }));

      const submitPromise = act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.isSubmitting).toBe(true);

      await submitPromise;

      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset form to initial values', () => {
      const initialValues = { name: 'John', email: 'john@example.com' };
      const { result } = renderHook(() => useForm({ initialValues }));

      act(() => {
        result.current.setValue('name', 'Jane');
        result.current.setError('name', 'Error');
        result.current.handleBlur('name');
        result.current.reset();
      });

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
    });
  });

  describe('isValid', () => {
    it('should be true when no errors', () => {
      const { result } = renderHook(() => useForm());

      expect(result.current.isValid).toBe(true);
    });

    it('should be false when there are errors', () => {
      const validationRules: ValidationRules = {
        name: { required: true },
      };
      const { result } = renderHook(() => useForm({ validationRules }));

      act(() => {
        result.current.handleBlur('name');
      });

      expect(result.current.isValid).toBe(false);
    });
  });
});
