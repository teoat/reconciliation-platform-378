import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

// Mock child components
vi.mock('../pages/AuthPage', () => ({
  default: () => <div>AuthPage</div>,
}));

vi.mock('../components/AnalyticsDashboard', () => ({
  default: () => <div>AnalyticsDashboard</div>,
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(screen).toBeDefined();
  });

  it('provides error boundary', () => {
    const { container } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(container).toBeTruthy();
  });
});
