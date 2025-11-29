/**
 * Test Utilities
 * 
 * Common utilities and helpers for writing tests
 */

import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';

/**
 * Create a test store with minimal configuration
 */
export function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      // Add your reducers here
      // Example: auth: authReducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
}

/**
 * Custom render function with providers
 */
export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    ...renderOptions
  }: {
    preloadedState?: object;
    store?: ReturnType<typeof createTestStore>;
  } & Omit<RenderOptions, 'wrapper'> = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <BrowserRouter>{children}</BrowserRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

/**
 * Mock API response helper
 */
export function createMockResponse<T>(data: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response;
}

/**
 * Wait for async operations
 */
export function waitForAsync() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Mock localStorage
 */
export function createMockLocalStorage() {
  const store: { [key: string]: string } = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
  };
}

/**
 * Mock window.location
 */
export function mockLocation(pathname: string) {
  delete (window as Window & { location?: { pathname: string } }).location;
  Object.defineProperty(window, 'location', {
    value: { pathname },
    writable: true,
    configurable: true,
  });
}

/**
 * Create mock error
 */
export interface MockError extends Error {
  code?: string;
}

export function createMockError(message: string, code?: string): MockError {
  const error = new Error(message) as MockError;
  if (code) {
    error.code = code;
  }
  return error;
}

