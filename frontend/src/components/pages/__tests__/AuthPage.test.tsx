import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test/utils';
import { AuthPage } from '../pages/AuthPage';

// Mock the useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    login: vi.fn().mockResolvedValue({ success: true }),
    register: vi.fn().mockResolvedValue({ success: true }),
    isLoading: false,
  }),
}));

describe('AuthPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form by default', () => {
    render(<AuthPage />);

    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('switches to register form when clicking register link', () => {
    render(<AuthPage />);

    fireEvent.click(screen.getByText(/create an account/i));

    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('switches back to login form when clicking sign in link', () => {
    render(<AuthPage />);

    // Switch to register first
    fireEvent.click(screen.getByText(/create an account/i));
    expect(screen.getByText('Create Account')).toBeInTheDocument();

    // Switch back to login
    fireEvent.click(screen.getByText(/sign in/i));
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('validates required fields in login form', async () => {
    render(<AuthPage />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('validates required fields in register form', async () => {
    render(<AuthPage />);

    // Switch to register form
    fireEvent.click(screen.getByText(/create an account/i));

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(<AuthPage />);

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('validates password minimum length', async () => {
    render(<AuthPage />);

    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.blur(passwordInput);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  it('submits login form with valid data', async () => {
    const mockLogin = vi.fn().mockResolvedValue({ success: true });
    vi.mocked(require('../../hooks/useAuth').useAuth).mockReturnValue({
      login: mockLogin,
      register: vi.fn(),
      isLoading: false,
    });

    render(<AuthPage />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('submits register form with valid data', async () => {
    const mockRegister = vi.fn().mockResolvedValue({ success: true });
    vi.mocked(require('../../hooks/useAuth').useAuth).mockReturnValue({
      login: vi.fn(),
      register: mockRegister,
      isLoading: false,
    });

    render(<AuthPage />);

    // Switch to register form
    fireEvent.click(screen.getByText(/create an account/i));

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      });
    });
  });

  it('shows loading state during submission', () => {
    vi.mocked(require('../../hooks/useAuth').useAuth).mockReturnValue({
      login: vi.fn(),
      register: vi.fn(),
      isLoading: true,
    });

    render(<AuthPage />);

    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
  });

  it('handles login error', async () => {
    const mockLogin = vi.fn().mockResolvedValue({ success: false, error: 'Invalid credentials' });
    vi.mocked(require('../../hooks/useAuth').useAuth).mockReturnValue({
      login: mockLogin,
      register: vi.fn(),
      isLoading: false,
    });

    render(<AuthPage />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong-password' } });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('handles register error', async () => {
    const mockRegister = vi
      .fn()
      .mockResolvedValue({ success: false, error: 'Email already exists' });
    vi.mocked(require('../../hooks/useAuth').useAuth).mockReturnValue({
      login: vi.fn(),
      register: mockRegister,
      isLoading: false,
    });

    render(<AuthPage />);

    // Switch to register form
    fireEvent.click(screen.getByText(/create an account/i));

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'existing@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });
});
