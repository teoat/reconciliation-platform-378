// ============================================================================
// AUTH SLICE
// ============================================================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, AuthTokens, LoginCredentials, RegisterCredentials, TwoFactorSetupResponse, RecoveryCodesResponse } from '@/types/auth';
import { AuthApiService } from '@/services/api/authService'; // Import AuthApiService
import axios from 'axios'; // Import axios for error handling

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  is2faRequired: false,
};

// Async thunks for API calls
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await AuthApiService.login(credentials);

      if (response.status === '2fa_required') {
        return rejectWithValue({ message: response.message, is2faRequired: true });
      }

      const { token, refresh_token, user } = response as { token: string; refresh_token: string; user: User };

      const tokens: AuthTokens = {
        accessToken: token,
        refreshToken: refresh_token,
        expiresIn: 3600, // Access token expiration (should come from backend)
        tokenType: 'Bearer',
      };

      // Store tokens in local storage for persistence across sessions
      localStorage.setItem('authTokens', JSON.stringify(tokens));

      return { user, tokens };
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const { message, status } = error.response.data;
        if (status === '2fa_required') {
          return rejectWithValue({ message, is2faRequired: true });
        }
        return rejectWithValue(message || 'Login failed.');
      }
      return rejectWithValue(error.message || 'An unknown error occurred.');
    }
  },
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      const response = await AuthApiService.register(credentials);
      return response.user; // Assuming backend returns the created user object
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Registration failed.');
      }
      return rejectWithValue(error.message || 'An unknown error occurred during registration.');
    }
  },
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await AuthApiService.logout();
      localStorage.removeItem('authTokens'); // Clear tokens from local storage
      return true;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Logout failed.');
      }
      return rejectWithValue(error.message || 'Failed to logout.');
    }
  },
);

export const refreshAccessToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    const currentRefreshToken = state.auth.tokens?.refreshToken;

    if (!currentRefreshToken) {
      return rejectWithValue('No refresh token available.');
    }

    try {
      const response = await AuthApiService.refreshAccessToken();
      const tokens: AuthTokens = {
        accessToken: response.token,
        refreshToken: response.refresh_token,
        expiresIn: 3600, // Access token expiration (should come from backend)
        tokenType: 'Bearer',
      };
      localStorage.setItem('authTokens', JSON.stringify(tokens)); // Update tokens in local storage
      return { user: response.user, tokens };
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to refresh token.');
      }
      return rejectWithValue(error.message || 'Failed to refresh token.');
    }
  },
);

// 2FA Thunks
export const generate2faSecret = createAsyncThunk(
  'auth/generate2faSecret',
  async (_, { rejectWithValue }) => {
    try {
      const response = await AuthApiService.generate2faSecret();
      return response;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to generate 2FA secret.');
      }
      return rejectWithValue(error.message || 'An unknown error occurred.');
    }
  },
);

export const verify2faCode = createAsyncThunk(
  'auth/verify2faCode',
  async (code: string, { rejectWithValue }) => {
    try {
      await AuthApiService.verify2faCode(code);
      return true; // Indicate success
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to verify 2FA code.');
      }
      return rejectWithValue(error.message || 'An unknown error occurred.');
    }
  },
);

export const enable2fa = createAsyncThunk(
  'auth/enable2fa',
  async (_, { rejectWithValue }) => {
    try {
      await AuthApiService.enable2fa();
      return true;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to enable 2FA.');
      }
      return rejectWithValue(error.message || 'An unknown error occurred.');
    }
  },
);

export const disable2fa = createAsyncThunk(
  'auth/disable2fa',
  async (_, { rejectWithValue }) => {
    try {
      await AuthApiService.disable2fa();
      return true;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to disable 2FA.');
      }
      return rejectWithValue(error.message || 'An unknown error occurred.');
    }
  },
);

export const generateRecoveryCodes = createAsyncThunk(
  'auth/generateRecoveryCodes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await AuthApiService.generateRecoveryCodes();
      return response.recoveryCodes;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to generate recovery codes.');
      }
      return rejectWithValue(error.message || 'An unknown error occurred.');
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthTokens: (state, action: PayloadAction<{ tokens: AuthTokens; user: User }>) => {
      state.tokens = action.payload.tokens;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.is2faRequired = false;
      state.error = null;
    },
    clearAuth: (state) => {
      Object.assign(state, initialState); // Reset to initial state
      localStorage.removeItem('authTokens'); // Ensure local storage is cleared
    },
    set2FARequired: (state, action: PayloadAction<boolean>) => {
      state.is2faRequired = action.payload;
    },
    setUser2FAStatus: (state, action: PayloadAction<boolean>) => {
      if (state.user) {
        state.user.is2faEnabled = action.payload;
      }
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = action.payload !== null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login User
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.is2faRequired = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.is2faRequired = false;
      })
      .addCase(loginUser.rejected, (state, action: any) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        if (action.payload && action.payload.is2faRequired) {
          state.is2faRequired = true;
          state.error = action.payload.message; // Set 2FA required message
        } else {
          state.error = action.payload || 'Login failed.';
        }
      })
      // Register User
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null; // Clear error on successful registration
      })
      .addCase(registerUser.rejected, (state, action: any) => {
        state.isLoading = false;
        state.error = action.payload || 'Registration failed.';
      })
      // Logout User
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        // Clear all auth state
        Object.assign(state, initialState);
      })
      .addCase(logoutUser.rejected, (state, action: any) => {
        state.isLoading = false;
        state.error = action.payload || 'Logout failed.';
      })
      // Refresh Access Token
      .addCase(refreshAccessToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tokens = action.payload.tokens;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(refreshAccessToken.rejected, (state, action: any) => {
        state.isLoading = false;
        Object.assign(state, initialState); // Clear state on refresh failure
        state.error = action.payload || 'Session expired. Please log in again.';
      })
      // 2FA Thunks
      .addCase(generate2faSecret.pending, (state) => {
        state.error = null;
      })
      .addCase(generate2faSecret.rejected, (state, action: any) => {
        state.error = action.payload || 'Failed to generate 2FA secret.';
      })
      .addCase(verify2faCode.pending, (state) => {
        state.error = null;
      })
      .addCase(verify2faCode.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(verify2faCode.rejected, (state, action: any) => {
        state.error = action.payload || 'Failed to verify 2FA code.';
      })
      .addCase(enable2fa.pending, (state) => {
        state.error = null;
      })
      .addCase(enable2fa.fulfilled, (state) => {
        if (state.user) {
          state.user.is2faEnabled = true;
        }
        state.error = null;
      })
      .addCase(enable2fa.rejected, (state, action: any) => {
        state.error = action.payload || 'Failed to enable 2FA.';
      })
      .addCase(disable2fa.pending, (state) => {
        state.error = null;
      })
      .addCase(disable2fa.fulfilled, (state) => {
        if (state.user) {
          state.user.is2faEnabled = false;
        }
        state.error = null;
      })
      .addCase(disable2fa.rejected, (state, action: any) => {
        state.error = action.payload || 'Failed to disable 2FA.';
      })
      .addCase(generateRecoveryCodes.pending, (state) => {
        state.error = null;
      })
      .addCase(generateRecoveryCodes.rejected, (state, action: any) => {
        state.error = action.payload || 'Failed to generate recovery codes.';
      });
  },
});

export const { setAuthTokens, clearAuth, set2FARequired, setUser2FAStatus, setUser, clearError } = authSlice.actions;

export default authSlice.reducer;

