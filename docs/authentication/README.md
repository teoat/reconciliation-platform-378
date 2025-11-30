# Authentication System - Comprehensive Guide

**Last Updated**: December 1, 2025
**Status**: Active

## Overview
This document provides a comprehensive guide to the authentication system implemented in the Reconciliation Platform. It covers user registration, login, session management using JWTs and refresh tokens, integration with OAuth2/OIDC providers, Two-Factor Authentication (2FA), and Role-Based Access Control (RBAC).

## Features

### 1. User Registration & Login (Email/Password)
- **Secure Password Hashing**: User passwords are securely hashed using Bcrypt.
- **Email/Password Login**: Standard authentication flow for users.

### 2. JWT Access & Refresh Tokens
- **Access Tokens**: Short-lived JSON Web Tokens (JWTs) for API authorization.
- **Refresh Tokens**: Long-lived tokens used to obtain new access tokens without re-authentication, stored securely in HTTP-only cookies.
- **Session Management**: Automated session creation, rotation, and invalidation.

### 3. OAuth2/OIDC Integration (Google, GitHub)
- **External Provider Login**: Users can register and log in using their Google or GitHub accounts.
- **User Linking/Creation**: Seamlessly links existing accounts or creates new ones based on OAuth provider IDs.

### 4. Two-Factor Authentication (2FA)
- **TOTP-based 2FA**: Supports Time-based One-Time Passwords (TOTP) for enhanced security.
- **QR Code Generation**: Provides QR codes for easy authenticator app setup.
- **Recovery Codes**: Generates one-time use recovery codes for account access in case of lost authenticator devices.
- **Enable/Disable**: Users can enable and disable 2FA from their profile.

### 5. Role-Based Access Control (RBAC)
- **Granular Permissions**: Defines roles (e.g., `admin`, `manager`, `user`, `viewer`) with specific permissions for resources and actions.
- **Middleware Enforcement**: RBAC is enforced at the API layer using custom middleware, ensuring that users can only access authorized resources.

## Backend Implementation Details (Rust)

### Key Services
- `AuthService`: Core authentication logic, JWT generation/validation, password hashing/verification.
- `EnhancedAuthService`: Extends `AuthService` with session management, refresh token handling, and 2FA delegation.
- `UserService`: Manages user creation, retrieval, updates, and OAuth linking.
- `OAuthService`: Handles OAuth2/OIDC authorization flow, including URL generation and callback processing for Google and GitHub.
- `TwoFactorAuthService`: Manages 2FA setup, TOTP secret generation/verification, and recovery codes.

### Relevant Models
- `User` (`backend/src/models/mod.rs`): Stores user information including `password_hash`, `auth_provider`, and `provider_id`.
- `UserSession` (`backend/src/models/mod.rs`): Stores session details including `session_token` and `refresh_token`.
- `TwoFactorAuth` (`backend/src/models/mod.rs`): Stores 2FA secrets, backup codes, and enablement status.

### API Endpoints (`/api/v2/auth/`)
- `POST /register`: Register a new user.
- `POST /login`: Authenticate user with email/password, potentially requiring 2FA.
- `POST /login/recovery`: Authenticate user with email and a 2FA recovery code.
- `POST /refresh`: Obtain new access and refresh tokens using a valid refresh token.
- `GET /oauth/google`: Initiate Google OAuth flow.
- `GET /oauth/google/callback`: Handle Google OAuth callback.
- `GET /oauth/github`: Initiate GitHub OAuth flow.
- `GET /oauth/github/callback`: Handle GitHub OAuth callback.
- `POST /2fa/generate`: Generate a new 2FA secret and QR code.
- `POST /2fa/verify`: Verify a provided 2FA code.
- `POST /2fa/enable`: Enable 2FA for the user.
- `POST /2fa/disable`: Disable 2FA for the user.
- `POST /2fa/recovery`: Generate new 2FA recovery codes.

### Middleware
- `CombinedSecurityMiddleware` (`backend/src/middleware/combined_security.rs`): Integrates RBAC enforcement by extracting user roles from JWTs and checking permissions against defined resources and actions.

### Database Schema Changes
- `users` table: Added `provider_id` (`VARCHAR(255) NULL`) to store unique IDs from OAuth providers.

### Environment Variables
- `JWT_SECRET`, `JWT_EXPIRATION`: For JWT signing and validation.
- `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URL`: For Google OAuth integration.
- `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET`, `GITHUB_OAUTH_REDIRECT_URL`: For GitHub OAuth integration.

## Frontend Implementation Details (React)

### UI Components (`frontend/src/components/auth/`)
- `LoginForm.tsx`: Handles email/password login, including 2FA code input.
- `RegistrationForm.tsx`: Handles new user registration.
- `OAuthButtons.tsx`: Provides buttons for Google and GitHub login.
- `TwoFactorSetup.tsx`: Displays 2FA QR code and secret, allows code verification.
- `RecoveryCodeDisplay.tsx`: Displays and manages recovery codes.
- `UserProfileForm.tsx`: For viewing/editing user profile information and 2FA status.

### Pages (`frontend/src/pages/auth/`)
- `LoginPage.tsx`: Main login page, integrating `LoginForm` and `OAuthButtons`.
- `RegisterPage.tsx`: Main registration page with `RegistrationForm`.
- `UserProfilePage.tsx`: Main page for user profile and 2FA management.
- `TwoFactorAuthPage.tsx`: Dedicated page for 2FA setup and recovery.

### State Management (`frontend/src/store/slices/authSlice.ts`)
- **Redux Toolkit Slice**: Manages authentication state (user, tokens, loading, errors, 2FA status).
- **Async Thunks**: Integrates with `AuthApiService` for backend interactions.

### API Service (`frontend/src/services/api/authService.ts`)
- Centralizes all authentication-related API calls using Axios.
- Handles JWT and refresh token management (sending access tokens in headers, expecting refresh tokens in HTTP-only cookies).

### Route Protection (`frontend/src/components/auth/ProtectedRoute.tsx`)
- **`ProtectedRoute` Component**: Wraps routes requiring authentication or specific roles, redirecting unauthenticated/unauthorized users.
- **React Router Integration**: Used in `frontend/src/App.tsx` for defining protected and public routes.

### Environment Variables
- `VITE_API_BASE_URL`: Base URL for backend API calls.
- `VITE_GOOGLE_OAUTH_REDIRECT_URL`, `VITE_GITHUB_OAUTH_REDIRECT_URL`: Frontend redirect URIs for OAuth flows.

## Deployment
The `docker-compose.yml` file orchestrates the backend and frontend services, configuring environment variables for authentication. Refer to the root `README.md` for instructions on building and running the Docker containers.

## Testing
Comprehensive unit, integration, and E2E tests have been implemented to ensure the reliability and security of the authentication system:
- **Backend (Rust) Tests**: Unit tests for `AuthService`, `EnhancedAuthService`, `UserService`, `OAuthService`, `TwoFactorAuthService`, and integration tests for all authentication API endpoints.
- **Frontend (React) Tests**: Unit tests for UI components, integration tests for `authSlice`, and E2E tests (`frontend/e2e/auth-flows.spec.ts`) for complete authentication flows including 2FA, OAuth, and RBAC.

