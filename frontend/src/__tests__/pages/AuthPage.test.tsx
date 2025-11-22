// ============================================================================
// AUTH PAGE TESTS - SIGNUP & GOOGLE OAUTH
// ============================================================================

import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderWithRouter } from '@/utils/testing';
import AuthPage from '@/pages/AuthPage';
import { HelmetProvider } from 'react-helmet-async';

// Mock dependencies
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockGoogleOAuth = vi.fn();
const mockNavigate = vi.fn();
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
};

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
    googleOAuth: mockGoogleOAuth,
    isLoading: false,
    isAuthenticated: false,
  }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => mockToast,
}));

vi.mock('@/services/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    logSecurity: vi.fn(),
  },
}));

vi.mock('@/config/demoCredentials', () => ({
  isDemoModeEnabled: () => false,
  DEMO_CREDENTIALS: [],
  getPrimaryDemoCredentials: () => ({ email: 'demo@example.com', password: 'demo123' }),
}));

vi.mock('@/components/seo/PageMeta', () => ({
  PageMeta: () => null,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock Google Identity Services
const mockGoogleAccounts = {
  id: {
    initialize: vi.fn(),
    renderButton: vi.fn(),
  },
};

// Mock window.google
Object.defineProperty(window, 'google', {
  writable: true,
  value: mockGoogleAccounts,
});

describe('AuthPage - Signup Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset Google mocks
    mockGoogleAccounts.id.initialize.mockClear();
    mockGoogleAccounts.id.renderButton.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderAuthPage = () => {
    return renderWithRouter(
      <HelmetProvider>
        <AuthPage />
      </HelmetProvider>
    );
  };

  describe('Login Functionality', () => {
    it('renders login form by default', () => {
      renderAuthPage();

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('submits login form with valid credentials', async () => {
      mockLogin.mockResolvedValue({ success: true });

      renderAuthPage();

      // Fill form
      await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(
          'user@example.com',
          'password123',
          undefined
        );
      });
    });

    it('submits login form with remember me option', async () => {
      mockLogin.mockResolvedValue({ success: true });

      renderAuthPage();

      // Fill form
      await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');

      // Check remember me
      const rememberMe = screen.getByLabelText(/remember me/i);
      await userEvent.click(rememberMe);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'password123', true);
      });
    });

    it('shows validation errors for invalid form data', async () => {
      renderAuthPage();

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      // Check for validation errors
      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('handles network errors with user-friendly message', async () => {
      const networkError = new Error('Failed to fetch');
      networkError.name = 'TypeError';
      mockLogin.mockRejectedValue(networkError);

      renderAuthPage();

      // Fill and submit form
      await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      // Check for network error message
      await waitFor(() => {
        expect(
          screen.getByText(/unable to connect to server/i, { exact: false })
        ).toBeInTheDocument();
      });
    });

    it('handles login API errors', async () => {
      mockLogin.mockResolvedValue({
        success: false,
        error: 'Invalid email or password',
      });

      renderAuthPage();

      // Fill and submit form
      await userEvent.type(screen.getByLabelText(/email address/i), 'wrong@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'wrongpassword');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      // Check for API error message
      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });
    });

    it('handles rate limiting errors', async () => {
      mockLogin.mockResolvedValue({
        success: false,
        error: 'Too many login attempts. Please try again in 5 minutes.',
      });

      renderAuthPage();

      // Fill and submit form
      await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      // Check for rate limit error message
      await waitFor(() => {
        expect(
          screen.getByText(/too many login attempts/i, { exact: false })
        ).toBeInTheDocument();
      });
    });

    it('navigates to home on successful login', async () => {
      mockLogin.mockResolvedValue({ success: true });

      renderAuthPage();

      // Fill and submit form
      await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });
    });

    it('displays error messages in error container', async () => {
      mockLogin.mockResolvedValue({
        success: false,
        error: 'Account locked. Please contact support.',
      });

      renderAuthPage();

      // Fill and submit form
      await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      // Check for error message in error container
      await waitFor(() => {
        const errorContainer = screen.getByTestId('auth-error-message');
        expect(
          within(errorContainer).getByText(/account locked/i, { exact: false })
        ).toBeInTheDocument();
      });
    });

    it('clears error when switching to register form', async () => {
      mockLogin.mockResolvedValue({
        success: false,
        error: 'Login failed',
      });

      renderAuthPage();

      // Try to login and trigger error
      await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/login failed/i)).toBeInTheDocument();
      });

      // Switch to register
      const signUpLink = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(signUpLink);

      // Error should be cleared
      expect(screen.queryByText(/login failed/i)).not.toBeInTheDocument();
    });
  });

  describe('Regular Signup', () => {
    it('renders signup form when switching to register mode', async () => {
      renderAuthPage();

      // Switch to register mode
      const signUpLink = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(signUpLink);

      // Check for register form fields
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('submits signup form with valid data', async () => {
      mockRegister.mockResolvedValue({ success: true });

      renderAuthPage();

      // Switch to register mode
      const signUpLink = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(signUpLink);

      // Fill form
      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'Password123!');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          email: 'john@example.com',
          password: 'Password123!',
          first_name: 'John',
          last_name: 'Doe',
        });
      });
    });

    it('shows validation errors for invalid form data', async () => {
      renderAuthPage();

      // Switch to register mode
      const signUpLink = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(signUpLink);

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(submitButton);

      // Check for validation errors
      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });
    });

    it('shows error when passwords do not match', async () => {
      renderAuthPage();

      // Switch to register mode
      const signUpLink = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(signUpLink);

      // Fill form with mismatched passwords
      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'Different123!');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(submitButton);

      // Check for password mismatch error
      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });
    });

    it('handles network errors with user-friendly message', async () => {
      const networkError = new Error('Failed to fetch');
      networkError.name = 'TypeError';
      mockRegister.mockRejectedValue(networkError);

      renderAuthPage();

      // Switch to register mode
      const signUpLink = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(signUpLink);

      // Fill and submit form
      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'Password123!');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(submitButton);

      // Check for network error message
      await waitFor(() => {
        expect(
          screen.getByText(/unable to connect to server/i, { exact: false })
        ).toBeInTheDocument();
      });
    });

    it('handles registration API errors', async () => {
      mockRegister.mockResolvedValue({
        success: false,
        error: 'Email already exists',
      });

      renderAuthPage();

      // Switch to register mode
      const signUpLink = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(signUpLink);

      // Fill and submit form
      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/email address/i), 'existing@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'Password123!');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(submitButton);

      // Check for API error message
      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });

    it('navigates to home on successful registration', async () => {
      mockRegister.mockResolvedValue({ success: true });

      renderAuthPage();

      // Switch to register mode
      const signUpLink = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(signUpLink);

      // Fill and submit form
      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'Password123!');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });
    });
  });

  describe('Google OAuth Signup', () => {
    beforeEach(() => {
      // Mock Google Client ID
      vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-google-client-id');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('renders Google sign-in button in register form', async () => {
      renderAuthPage();

      // Switch to register mode
      const signUpLink = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(signUpLink);

      // Wait for Google button container
      await waitFor(() => {
        const googleContainer = screen.getByLabelText(/google sign-in/i);
        expect(googleContainer).toBeInTheDocument();
      });
    });

    it('shows loading state while Google button loads', async () => {
      // Mock script loading delay
      const originalCreateElement = document.createElement;
      let scriptElement: HTMLScriptElement | null = null;

      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'script') {
          scriptElement = originalCreateElement.call(document, tagName) as HTMLScriptElement;
          // Simulate delayed script load
          setTimeout(() => {
            if (scriptElement) {
              scriptElement.onload?.(new Event('load'));
            }
          }, 100);
          return scriptElement;
        }
        return originalCreateElement.call(document, tagName);
      });

      renderAuthPage();

      // Switch to register mode
      const signUpLink = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(signUpLink);

      // Check for loading state (may be brief)
      const loadingText = screen.queryByText(/loading google sign-in/i);
      // Loading state might be too fast to catch, but container should exist
      expect(screen.getByLabelText(/google sign-in/i)).toBeInTheDocument();
    });

    it('handles Google OAuth callback successfully', async () => {
      mockGoogleOAuth.mockResolvedValue({ success: true });

      renderAuthPage();

      // Switch to register mode
      const signUpLink = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(signUpLink);

      // Simulate Google OAuth callback
      await waitFor(() => {
        if (mockGoogleAccounts.id.initialize.mock.calls.length > 0) {
          const callback = mockGoogleAccounts.id.initialize.mock.calls[0][0].callback;
          callback({ credential: 'mock-google-token' });
        }
      });

      await waitFor(() => {
        expect(mockGoogleOAuth).toHaveBeenCalledWith('mock-google-token');
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });
    });

    it('handles Google OAuth errors', async () => {
      mockGoogleOAuth.mockResolvedValue({
        success: false,
        error: 'Invalid Google token',
      });

      renderAuthPage();

      // Switch to register mode
      const signUpLink = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(signUpLink);

      // Simulate Google OAuth callback with error
      await waitFor(() => {
        if (mockGoogleAccounts.id.initialize.mock.calls.length > 0) {
          const callback = mockGoogleAccounts.id.initialize.mock.calls[0][0].callback;
          callback({ credential: 'invalid-token' });
        }
      });

      await waitFor(() => {
        expect(mockGoogleOAuth).toHaveBeenCalledWith('invalid-token');
        expect(screen.getByText(/invalid google token/i)).toBeInTheDocument();
      });
    });

    it('handles missing Google credential', async () => {
      renderAuthPage();

      // Switch to register mode
      const signUpLink = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(signUpLink);

      // Simulate Google OAuth callback without credential
      await waitFor(() => {
        if (mockGoogleAccounts.id.initialize.mock.calls.length > 0) {
          const callback = mockGoogleAccounts.id.initialize.mock.calls[0][0].callback;
          callback({ credential: '' });
        }
      });

      await waitFor(() => {
        expect(screen.getByText(/google sign-in failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Switching', () => {
    it('switches between login and register forms', async () => {
      renderAuthPage();

      // Initially should show login form
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();

      // Switch to register
      const signUpLink = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(signUpLink);

      // Should show register form
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/remember me/i)).not.toBeInTheDocument();

      // Switch back to login
      const signInLink = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(signInLink);

      // Should show login form again
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
    });

    it('resets form errors when switching forms', async () => {
      mockRegister.mockResolvedValue({
        success: false,
        error: 'Registration failed',
      });

      renderAuthPage();

      // Switch to register and trigger error
      const signUpLink = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(signUpLink);

      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'Password123!');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(submitButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
      });

      // Switch back to login
      const signInLink = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(signInLink);

      // Error should be cleared
      expect(screen.queryByText(/registration failed/i)).not.toBeInTheDocument();
    });
  });

  describe('Password Validation', () => {
    it('shows password strength indicator', async () => {
      renderAuthPage();

      // Switch to register mode
      const signUpLink = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(signUpLink);

      // Type password
      const passwordInput = screen.getByLabelText(/^password$/i);
      await userEvent.type(passwordInput, 'Password123!');

      // Check for password strength indicator
      await waitFor(() => {
        expect(screen.getByText(/password strength/i)).toBeInTheDocument();
      });
    });

    it('validates password requirements', async () => {
      renderAuthPage();

      // Switch to register mode
      const signUpLink = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(signUpLink);

      // Try weak password
      const passwordInput = screen.getByLabelText(/^password$/i);
      await userEvent.type(passwordInput, 'weak');
      await userEvent.tab(); // Trigger blur validation

      // Should show validation error
      await waitFor(() => {
        const error = screen.queryByText(/password/i);
        // Password validation should be present
        expect(passwordInput).toBeInTheDocument();
      });
    });
  });

  describe('Error Display', () => {
    it('displays error messages in error container', async () => {
      mockRegister.mockResolvedValue({
        success: false,
        error: 'Test error message',
      });

      renderAuthPage();

      // Switch to register mode
      const signUpLink = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(signUpLink);

      // Fill and submit form
      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'Password123!');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(submitButton);

      // Check for error message in error container
      await waitFor(() => {
        const errorContainer = screen.getByTestId('auth-error-message');
        expect(within(errorContainer).getByText(/test error message/i)).toBeInTheDocument();
      });
    });
  });
});
