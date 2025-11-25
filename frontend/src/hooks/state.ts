// ============================================================================
import { logger } from '@/services/logger';
// STATE MANAGEMENT HOOKS - SINGLE SOURCE OF TRUTH
// ============================================================================

import { useState, useCallback } from 'react';
// Using direct localStorage and sessionStorage APIs

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch (error) {
      logger.error(`Error reading localStorage key "${key}":`, error as any);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        logger.error(`Error setting localStorage key "${key}":`, error as any);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      window.localStorage.removeItem(key);
    } catch (error) {
      logger.error(`Error removing localStorage key "${key}":`, error as any);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
};

export const useSessionStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch (error) {
      logger.error(`Error reading sessionStorage key "${key}":`, error as any);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        logger.error(`Error setting sessionStorage key "${key}":`, error as any);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      window.sessionStorage.removeItem(key);
    } catch (error) {
      logger.error(`Error removing sessionStorage key "${key}":`, error as any);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
};

export const useToggle = (initialValue: boolean = false) => {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue((v) => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return [value, { toggle, setTrue, setFalse }] as const;
};

export const useCounter = (initialValue: number = 0) => {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => setCount((c) => c + 1), []);
  const decrement = useCallback(() => setCount((c) => c - 1), []);
  const reset = useCallback(() => setCount(initialValue), [initialValue]);
  const setValue = useCallback((value: number) => setCount(value), []);

  return [count, { increment, decrement, reset, setValue }] as const;
};

export const useArray = <T>(initialValue: T[] = []) => {
  const [array, setArray] = useState<T[]>(initialValue);

  const push = useCallback((item: T) => setArray((arr) => [...arr, item]), []);
  const pop = useCallback(() => setArray((arr) => arr.slice(0, -1)), []);
  const shift = useCallback(() => setArray((arr) => arr.slice(1)), []);
  const unshift = useCallback((item: T) => setArray((arr) => [item, ...arr]), []);
  const insert = useCallback(
    (index: number, item: T) =>
      setArray((arr) => [...arr.slice(0, index), item, ...arr.slice(index)]),
    []
  );
  const remove = useCallback(
    (index: number) => setArray((arr) => [...arr.slice(0, index), ...arr.slice(index + 1)]),
    []
  );
  const update = useCallback(
    (index: number, item: T) => setArray((arr) => arr.map((val, i) => (i === index ? item : val))),
    []
  );
  const clear = useCallback(() => setArray([]), []);
  const reset = useCallback(() => setArray(initialValue), [initialValue]);

  return [array, { push, pop, shift, unshift, insert, remove, update, clear, reset }] as const;
};

export const useObject = <T extends Record<string, unknown>>(initialValue: T) => {
  const [object, setObject] = useState<T>(initialValue);

  const setValue = useCallback(
    (key: keyof T, value: T[keyof T]) => setObject((obj) => ({ ...obj, [key]: value })),
    []
  );
  const setValues = useCallback(
    (values: Partial<T>) => setObject((obj) => ({ ...obj, ...values })),
    []
  );
  const removeKey = useCallback(
    (key: keyof T) =>
      setObject((obj) => {
        const { [key]: removed, ...rest } = obj;
        return rest as T;
      }),
    []
  );
  const reset = useCallback(() => setObject(initialValue), [initialValue]);

  return [object, { setValue, setValues, removeKey, reset }] as const;
};
