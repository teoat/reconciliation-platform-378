// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string; // e.g., 'active', 'inactive'
  emailVerified: boolean;
  is2faEnabled: boolean;
  lastLoginAt?: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  // Add any other user-related fields as needed
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Expiration of access token in seconds
  tokenType: string; // e.g., 'Bearer'
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  is2faRequired: boolean; // New field to indicate if 2FA is needed for login
}

export interface LoginCredentials {
  email: string;
  password: string;
  twoFactorCode?: string; // Optional 2FA code
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeImage: string; // Base64 encoded PNG
}

export interface RecoveryCodesResponse {
  recoveryCodes: string[];
}
