import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ReconciliationPage from '../../pages/ReconciliationPage';

// Mock hooks
vi.mock('../../hooks/useApi', () => ({
  useProject: vi.fn(() => ({
    project: { id: '1', name: 'Test Project' },
    isLoading: false,
  })),
  useDataSources: vi.fn(() => ({
    dataSources: [],
    uploadFile: vi.fn(),
    processFile: vi.fn(),
  })),
  useReconciliationJobs: vi.fn(() => ({
    jobs: [],
    createJob: vi.fn(),
    startJob: vi.fn(),
  })),
  useReconciliationMatches: vi.fn(() => ({
    matches: [],
    updateMatch: vi.fn(),
  })),
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ projectId: '1' }),
    useNavigate: () => mockNavigate,
  };
});

describe('ReconciliationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <ReconciliationPage />
      </BrowserRouter>
    );
    expect(screen).toBeDefined();
  });

  it('displays project information', async () => {
    render(
      <BrowserRouter>
        <ReconciliationPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/reconciliation/i)).toBeInTheDocument();
    });
  });
});
