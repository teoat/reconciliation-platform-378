import React, { ReactElement } from 'react';
import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import { rootReducer } from '@/store/unifiedStore';

// Custom render function with router and common providers
interface CustomRenderOptions {
  route?: string;
  initialEntries?: string[];
  store?: ReturnType<typeof configureStore>;
}

export function renderWithRouter(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): ReturnType<typeof render> {
  const { route = '/', initialEntries: _initialEntries = [route], store } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store || configureStore({ reducer: rootReducer })}>
      <BrowserRouter>{children}</BrowserRouter>
    </Provider>
  );

  return render(ui, { wrapper: Wrapper });
}

// Mock factories for common data structures
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  ...overrides,
});

export const createMockProject = (overrides = {}) => ({
  id: 'project-123',
  name: 'Test Project',
  description: 'A test project',
  ownerId: 'user-123',
  status: 'active',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  ...overrides,
});

export const createMockApiResponse = (data: unknown, overrides: Record<string, unknown> = {}) => ({
  data,
  success: true,
  message: 'Success',
  timestamp: new Date().toISOString(),
  ...overrides,
});

export const createMockApiError = (message = 'API Error', status = 500) => ({
  success: false,
  message,
  status,
  timestamp: new Date().toISOString(),
  error: {
    code: 'API_ERROR',
    details: { status },
  },
});

// Component testing helpers
export const createMockButton = (props = {}) => <button {...props}>Test Button</button>;

export const createMockInput = (props = {}) => <input {...props} />;

// API testing helpers
export const mockApiCall = (url: string, response: unknown) => {
  global.fetch = vi.fn().mockImplementationOnce((requestUrl: string) => {
    if (requestUrl.includes(url)) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(response),
      });
    }
    return Promise.reject(new Error('Unexpected URL'));
  });
};

export const mockApiError = (url: string, error: unknown, status = 500) => {
  global.fetch = vi.fn().mockImplementationOnce((requestUrl: string) => {
    if (requestUrl.includes(url)) {
      return Promise.resolve({
        ok: false,
        status,
        json: () => Promise.resolve(error),
      });
    }
    return Promise.reject(new Error('Unexpected URL'));
  });
};

// Form testing helpers
export const fillForm = async (container: HTMLElement, data: Record<string, unknown>) => {
  for (const [name, value] of Object.entries(data)) {
    const input = container.querySelector(`[name="${name}"]`) as HTMLInputElement;
    if (input) {
      if (input.type === 'checkbox') {
        if (value) input.click();
      } else {
        input.value = String(value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }
  await waitFor(() => {});
};

export const submitForm = async (container: HTMLElement, formSelector = 'form') => {
  const form = container.querySelector(formSelector) as HTMLFormElement;
  if (form) {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await waitFor(() => {});
  }
};

// Export all utilities
export const testingUtils = {
  renderWithRouter,
  createMockUser,
  createMockProject,
  createMockApiResponse,
  createMockApiError,
  createMockButton,
  createMockInput,
  mockApiCall,
  mockApiError,
  fillForm,
  submitForm,
};

// Additional exports for backward compatibility
export const customRender = renderWithRouter;
export const testButtonComponent = createMockButton;
export const testInputComponent = createMockInput;
export const testModalComponent = (Component: React.ComponentType<Record<string, unknown>>) => Component;

export default testingUtils;
