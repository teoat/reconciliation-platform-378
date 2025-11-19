import { render as rtlRender } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { rootReducer } from '../store/unifiedStore';

export const createMockStore = (initialState: Record<string, unknown> = {}) => {
  return configureStore({
    reducer: rootReducer,
    preloadedState: initialState,
  });
};

// Custom render function that includes providers
export const render = (
  ui: ReactElement,
  { initialState = {}, store = createMockStore(initialState), ...renderOptions }: Record<string, unknown> = {}
) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <BrowserRouter>{children}</BrowserRouter>
    </Provider>
  );

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock API client
export const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
};

// Mock services
export const mockAuthService = {
  login: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
  getCurrentUser: vi.fn(),
};

export const mockProjectService = {
  getProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
};
