import { screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Dashboard } from '../Dashboard';
import { renderWithProviders } from '../../__tests__/utils/testHelpers';

// Mock required props
const mockWidgets = [
  {
    id: 'widget-1',
    type: 'metric' as const,
    title: 'Total Records',
    config: {},
    layout: { x: 0, y: 0, w: 1, h: 1 },
  },
  {
    id: 'widget-2',
    type: 'chart' as const,
    title: 'Status Overview',
    config: {},
    layout: { x: 1, y: 0, w: 1, h: 1 },
  },
];

const defaultProps = {
  projectId: 'test-project-1',
  widgets: mockWidgets,
};

// Mock the hooks and services
vi.mock('@/hooks/useApi', () => ({
  useProjects: vi.fn(() => ({
    projects: [
      { id: '1', name: 'Project 1', description: 'Test project 1' },
      { id: '2', name: 'Project 2', description: 'Test project 2' },
    ],
    isLoading: false,
    error: null,
    fetchProjects: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
  })),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => vi.fn()),
}));

describe('Dashboard', () => {
  it('should render dashboard title', () => {
    renderWithProviders(<Dashboard {...defaultProps} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should display projects list', () => {
    renderWithProviders(<Dashboard {...defaultProps} />);

    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
    expect(screen.getByText('Test project 1')).toBeInTheDocument();
    expect(screen.getByText('Test project 2')).toBeInTheDocument();
  });

  it('should render project cards with proper accessibility', () => {
    renderWithProviders(<Dashboard {...defaultProps} />);

    const projectCards = screen.getAllByRole('button');
    expect(projectCards).toHaveLength(2);

    projectCards.forEach((card, index) => {
      expect(card).toHaveAttribute('tabIndex', '0');
      expect(card).toHaveAttribute('aria-label', `Open project Project ${index + 1}`);
    });
  });

  it('should navigate to project when clicked', () => {
    const mockNavigate = vi.fn();
    vi.mocked(vi.importMock('react-router-dom')).useNavigate = vi.fn(() => mockNavigate);

    renderWithProviders(<Dashboard {...defaultProps} />);

    const firstProjectCard = screen.getByText('Project 1').closest('div');
    fireEvent.click(firstProjectCard!);

    expect(mockNavigate).toHaveBeenCalledWith('/projects/1');
  });

  it('should navigate to project when Enter key is pressed', () => {
    const mockNavigate = vi.fn();
    vi.mocked(vi.importMock('react-router-dom')).useNavigate = vi.fn(() => mockNavigate);

    renderWithProviders(<Dashboard {...defaultProps} />);

    const firstProjectCard = screen.getByText('Project 1').closest('div');
    fireEvent.keyDown(firstProjectCard!, { key: 'Enter' });

    expect(mockNavigate).toHaveBeenCalledWith('/projects/1');
  });

  it('should navigate to project when Space key is pressed', () => {
    const mockNavigate = vi.fn();
    vi.mocked(vi.importMock('react-router-dom')).useNavigate = vi.fn(() => mockNavigate);

    renderWithProviders(<Dashboard {...defaultProps} />);

    const firstProjectCard = screen.getByText('Project 1').closest('div');
    fireEvent.keyDown(firstProjectCard!, { key: ' ' });

    expect(mockNavigate).toHaveBeenCalledWith('/projects/1');
  });

  it('should display loading state', () => {
    vi.mocked(await import('@/hooks/useApi')).useProjects.mockReturnValue({
      projects: [],
      isLoading: true,
      error: null,
      fetchProjects: vi.fn(),
      createProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
    });

    renderWithProviders(<Dashboard {...defaultProps} />);

    expect(screen.getByText('Loading projects...')).toBeInTheDocument();
  });

  it('should display error state', () => {
    vi.mocked(await import('@/hooks/useApi')).useProjects.mockReturnValue({
      projects: [],
      isLoading: false,
      error: 'Failed to load projects',
      fetchProjects: vi.fn(),
      createProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
    });

    renderWithProviders(<Dashboard {...defaultProps} />);

    expect(screen.getByText('Error loading projects: Failed to load projects')).toBeInTheDocument();
  });

  it('should display empty state when no projects', () => {
    vi.mocked(await import('@/hooks/useApi')).useProjects.mockReturnValue({
      projects: [],
      isLoading: false,
      error: null,
      fetchProjects: vi.fn(),
      createProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
    });

    renderWithProviders(<Dashboard {...defaultProps} />);

    expect(screen.getByText('No projects found')).toBeInTheDocument();
    expect(screen.getByText('Create your first project to get started')).toBeInTheDocument();
  });

  it('should render create project button', () => {
    renderWithProviders(<Dashboard {...defaultProps} />);

    const createButton = screen.getByText('Create Project');
    expect(createButton).toBeInTheDocument();
    expect(createButton).toHaveAttribute('href', '/projects/create');
  });

  it('should render recent activity section', () => {
    renderWithProviders(<Dashboard {...defaultProps} />);

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  it('should render quick actions section', () => {
    renderWithProviders(<Dashboard {...defaultProps} />);

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });
});
