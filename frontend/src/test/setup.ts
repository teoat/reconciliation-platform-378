import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver
beforeAll(() => {
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  };
});

// Mock ResizeObserver
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  };
});

// Mock matchMedia
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Mock localStorage
beforeAll(() => {
  const localStorageMock: Storage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
  };
  global.localStorage = localStorageMock;
});

// Mock sessionStorage
beforeAll(() => {
  const sessionStorageMock: Storage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
  };
  global.sessionStorage = sessionStorageMock;
});

// Mock fetch
beforeAll(() => {
  global.fetch = vi.fn();
});

// Mock secure storage for tests
vi.mock('../services/secureStorage', () => ({
  SecureStorageService: class {
    get = vi.fn();
    set = vi.fn();
    remove = vi.fn();
    clear = vi.fn();
  },
}));

// Mock WebSocket
beforeAll(() => {
  global.WebSocket = class WebSocket {
    constructor(_url?: string | URL, _protocols?: string | string[]) {}
    close(_code?: number, _reason?: string) {}
    send(_data: string | ArrayBufferLike | Blob | ArrayBufferView) {}
    addEventListener(_type: string, _listener: EventListener | EventListenerObject | null, _options?: boolean | AddEventListenerOptions) {}
    removeEventListener(_type: string, _listener: EventListener | EventListenerObject | null, _options?: boolean | EventListenerOptions) {}
    CONNECTING = 0;
    OPEN = 1;
    CLOSING = 2;
    CLOSED = 3;
    readyState = WebSocket.CONNECTING;
    url = '';
    protocol = '';
    extensions = '';
    binaryType: BinaryType = 'blob';
    bufferedAmount = 0;
    onopen: ((this: WebSocket, ev: Event) => unknown) | null = null;
    onerror: ((this: WebSocket, ev: Event) => unknown) | null = null;
    onclose: ((this: WebSocket, ev: CloseEvent) => unknown) | null = null;
    onmessage: ((this: WebSocket, ev: MessageEvent) => unknown) | null = null;
    dispatchEvent(_event: Event): boolean { return true; }
  } as typeof WebSocket;
});

afterAll(() => {
  vi.clearAllMocks();
});
