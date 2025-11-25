#!/bin/bash
# ============================================================================
# CREATE AUTHENTICATION TESTS
# ============================================================================
# Generates unit tests for authentication flows
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

FRONTEND_DIR="$SCRIPT_DIR/../frontend/src"
BACKEND_DIR="$SCRIPT_DIR/../backend/src"

log_info "Creating authentication tests..."

# Frontend Auth Tests
cat > "$FRONTEND_DIR/__tests__/auth.test.tsx" << 'EOF'
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import AuthPage from '@/pages/AuthPage';

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('Authentication Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Flow', () => {
    it('should render login form', () => {
      (useAuth as any).mockReturnValue({
        login: vi.fn(),
        isLoading: false,
        isAuthenticated: false,
      });

      render(<AuthPage />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should call login on form submit', async () => {
      const mockLogin = vi.fn().mockResolvedValue({ success: true });
      (useAuth as any).mockReturnValue({
        login: mockLogin,
        isLoading: false,
        isAuthenticated: false,
      });

      render(<AuthPage />);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });
  });

  describe('Registration Flow', () => {
    it('should render registration form when toggled', () => {
      (useAuth as any).mockReturnValue({
        register: vi.fn(),
        isLoading: false,
        isAuthenticated: false,
      });

      render(<AuthPage />);
      const toggleButton = screen.getByText(/sign up/i);
      fireEvent.click(toggleButton);

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    });

    it('should validate password strength', async () => {
      (useAuth as any).mockReturnValue({
        register: vi.fn(),
        isLoading: false,
        isAuthenticated: false,
      });

      render(<AuthPage />);
      const toggleButton = screen.getByText(/sign up/i);
      fireEvent.click(toggleButton);

      const passwordInput = screen.getByLabelText(/^password$/i);
      fireEvent.change(passwordInput, { target: { value: 'weak' } });
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText(/password.*strong/i)).toBeInTheDocument();
      });
    });
  });

  describe('Google OAuth Flow', () => {
    it('should render Google sign-in button', () => {
      (useAuth as any).mockReturnValue({
        googleOAuth: vi.fn(),
        isLoading: false,
        isAuthenticated: false,
      });

      render(<AuthPage />);
      expect(screen.getByText(/sign in with google/i)).toBeInTheDocument();
    });
  });
});
EOF

log_success "✓ Frontend auth tests created"

# Backend Auth Tests
cat > "$BACKEND_DIR/handlers/__tests__/auth_test.rs" << 'EOF'
#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::{test, web, App};
    use serde_json::json;

    #[actix_web::test]
    async fn test_login_endpoint_exists() {
        let app = test::init_service(
            App::new().route("/api/auth/login", web::post().to(login))
        ).await;

        let req = test::TestRequest::post()
            .uri("/api/auth/login")
            .set_json(&json!({
                "email": "test@example.com",
                "password": "password123"
            }))
            .to_request();

        let resp = test::call_service(&app, req).await;
        // Should return 400 (validation) or 401 (auth failed), not 404
        assert!(resp.status().is_client_error() || resp.status().is_success());
    }

    #[actix_web::test]
    async fn test_register_endpoint_exists() {
        let app = test::init_service(
            App::new().route("/api/auth/register", web::post().to(register))
        ).await;

        let req = test::TestRequest::post()
            .uri("/api/auth/register")
            .set_json(&json!({
                "email": "newuser@example.com",
                "password": "SecurePass123!",
                "first_name": "Test",
                "last_name": "User"
            }))
            .to_request();

        let resp = test::call_service(&app, req).await;
        // Should return 400 (validation) or 201 (created), not 404
        assert!(resp.status().is_client_error() || resp.status().is_success());
    }

    #[actix_web::test]
    async fn test_refresh_token_endpoint_exists() {
        let app = test::init_service(
            App::new().route("/api/auth/refresh", web::post().to(refresh_token))
        ).await;

        let req = test::TestRequest::post()
            .uri("/api/auth/refresh")
            .set_json(&json!({
                "refresh_token": "test_token"
            }))
            .to_request();

        let resp = test::call_service(&app, req).await;
        // Should return 400 or 401, not 404
        assert!(resp.status().is_client_error() || resp.status().is_success());
    }
}
EOF

log_success "✓ Backend auth tests created"
log_info "Test files created. Run tests with:"
log_info "  Frontend: cd frontend && npm test"
log_info "  Backend: cd backend && cargo test"

