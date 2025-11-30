import axios from 'axios';
import { LoginCredentials, RegisterCredentials, AuthTokens, User, TwoFactorSetupResponse, RecoveryCodesResponse } from '@/types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v2';

const authApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for sending/receiving HTTP-only cookies
});

// Add a request interceptor to include the access token
authApi.interceptors.request.use(
  (config) => {
    const tokensString = localStorage.getItem('authTokens');
    if (tokensString) {
      const tokens: AuthTokens = JSON.parse(tokensString);
      if (tokens && tokens.accessToken) {
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export const AuthApiService = {
  login: async (credentials: LoginCredentials): Promise<{ tokens: AuthTokens; user: User; message?: string; status?: string } | { message: string; status: string }> => {
    const response = await authApi.post('/auth/login', {
      email: credentials.email,
      password: credentials.password,
      two_factor_code: credentials.twoFactorCode,
    });
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<{ user: User }> => {
    const response = await authApi.post('/auth/register', {
      email: credentials.email,
      password: credentials.password,
      first_name: credentials.firstName,
      last_name: credentials.lastName,
      role: credentials.role,
    });
    return response.data;
  },

  refreshAccessToken: async (): Promise<{ token: string; refresh_token: string; user: User }> => {
    const response = await authApi.post('/auth/refresh', {});
    return response.data;
  },

  logout: async (): Promise<void> => {
    // Invalidate refresh token on backend. No specific endpoint for now, relies on cookie deletion.
    // A real logout endpoint would likely invalidate the refresh token on the server side.
    // For now, client-side token clearing is sufficient for this example.
    // If a specific logout endpoint exists that invalidates server-side sessions, it would go here.
    // await authApi.post('/auth/logout');
    return;
  },

  get2faStatus: async (): Promise<{ isEnabled: boolean; secret?: string; qrCode?: string; recoveryCodes?: string[] }> => {
    // This endpoint would typically be protected and return the user's 2FA status
    // For now, simulate a response
    return { isEnabled: false };
  },

  generate2faSecret: async (): Promise<TwoFactorSetupResponse> => {
    const response = await authApi.post('/auth/2fa/generate');
    return response.data;
  },

  verify2faCode: async (code: string): Promise<{ message: string }> => {
    const response = await authApi.post('/auth/2fa/verify', { code });
    return response.data;
  },

  enable2fa: async (): Promise<{ message: string }> => {
    const response = await authApi.post('/auth/2fa/enable');
    return response.data;
  },

  disable2fa: async (): Promise<{ message: string }> => {
    const response = await authApi.post('/auth/2fa/disable');
    return response.data;
  },

  generateRecoveryCodes: async (): Promise<RecoveryCodesResponse> => {
    const response = await authApi.post('/auth/2fa/recovery');
    return response.data;
  },

  // OAuth related functions might be direct redirects, but if they involve backend calls,
  // they would be defined here.
  // e.g., getGoogleAuthUrl: async () => { ... }
};
