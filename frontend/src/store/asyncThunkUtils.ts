// ============================================================================
// SHARED ASYNC THUNK UTILITIES
// ============================================================================

import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../services/apiClient';

// ============================================================================
// COMMON ERROR HANDLING
// ============================================================================

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export const handleApiError = (
  error: Error | unknown | { response?: { data?: { message?: string } }; message?: string }
): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const err = error as { response?: { data?: { message?: string } } };
    if (err.response?.data?.message) {
      return err.response.data.message;
    }
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const err = error as { message?: string };
    if (err.message) {
      return err.message;
    }
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};

// ============================================================================
// GENERIC API THUNK CREATORS
// ============================================================================

/**
 * Creates a standardized async thunk for GET requests
 */
export const createGetThunk = <TData = unknown>(
  actionType: string,
  endpoint: string | ((params?: Record<string, unknown>) => string),
  options: {
    requiresAuth?: boolean;
    cache?: boolean;
    transformResponse?: (data: unknown) => TData;
  } = {}
) => {
  const { requiresAuth: _requiresAuth = true, cache: _cache = true, transformResponse } = options;

  return createAsyncThunk(
    actionType,
    async (params: Record<string, unknown> | undefined, { rejectWithValue }) => {
      try {
        const url = typeof endpoint === 'function' ? endpoint(params) : endpoint;

        const response = await apiClient.get(url, params);

        const data = transformResponse ? transformResponse(response.data) : response.data;
        return data;
      } catch (error) {
        return rejectWithValue(handleApiError(error));
      }
    }
  );
};

/**
 * Creates a standardized async thunk for POST requests
 */
export const createPostThunk = <TData = unknown>(
  actionType: string,
  endpoint: string | ((data?: unknown) => string),
  options: {
    requiresAuth?: boolean;
    transformRequest?: (data: unknown) => unknown;
    transformResponse?: (data: unknown) => TData;
  } = {}
) => {
  const { requiresAuth: _requiresAuth = true, transformRequest, transformResponse } = options;

  return createAsyncThunk(actionType, async (data: unknown | undefined, { rejectWithValue }) => {
    try {
      const url = typeof endpoint === 'function' ? endpoint(data) : endpoint;
      const requestData = transformRequest ? transformRequest(data) : data;

      const response = await apiClient.post(url, requestData);
      const result = transformResponse ? transformResponse(response.data) : response.data;
      return result;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  });
};

/**
 * Creates a standardized async thunk for PUT requests
 */
export const createPutThunk = <TData = unknown>(
  actionType: string,
  endpoint: string | ((params: { id: string; data?: unknown }) => string),
  options: {
    requiresAuth?: boolean;
    transformRequest?: (data: unknown) => unknown;
    transformResponse?: (data: unknown) => TData;
  } = {}
) => {
  const { requiresAuth: _requiresAuth = true, transformRequest, transformResponse } = options;

  return createAsyncThunk(
    actionType,
    async (params: { id: string; data?: unknown }, { rejectWithValue }) => {
      try {
        const url = typeof endpoint === 'function' ? endpoint(params) : endpoint;
        const requestData = transformRequest ? transformRequest(params.data) : params.data;

        const response = await apiClient.put(url, requestData);
        const result = transformResponse ? transformResponse(response.data) : response.data;
        return result;
      } catch (error) {
        return rejectWithValue(handleApiError(error));
      }
    }
  );
};

/**
 * Creates a standardized async thunk for DELETE requests
 */
export const createDeleteThunk = <TData = unknown>(
  actionType: string,
  endpoint: string | ((id: string) => string),
  options: {
    requiresAuth?: boolean;
    transformResponse?: (data: unknown) => TData;
    returnId?: boolean;
  } = {}
) => {
  const { requiresAuth: _requiresAuth = true, transformResponse, returnId = false } = options;

  return createAsyncThunk(actionType, async (id: string, { rejectWithValue }) => {
    try {
      const url = typeof endpoint === 'function' ? endpoint(id) : endpoint;

      const response = await apiClient.delete(url);
      if (returnId) {
        return id;
      }

      const result = transformResponse ? transformResponse(response.data) : response.data;
      return result;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  });
};

// ============================================================================
// AUTH-SPECIFIC THUNKS
// ============================================================================

export const createAuthThunk = <TRequest, TResponse>(
  actionType: string,
  endpoint: string,
  options: {
    skipAuth?: boolean;
    transformRequest?: (data: TRequest) => unknown;
    transformResponse?: (data: unknown) => TResponse;
  } = {}
) => {
  const { skipAuth: _skipAuth = true, transformRequest, transformResponse } = options;

  return createAsyncThunk(actionType, async (data: TRequest, { rejectWithValue }) => {
    try {
      const requestData = transformRequest ? transformRequest(data) : data;

      const response = await apiClient.post(endpoint, requestData);
      const result = transformResponse ? transformResponse(response.data) : response.data;
      return result;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  });
};

// ============================================================================
// FILE UPLOAD THUNK
// ============================================================================

export const createFileUploadThunk = (
  actionType: string,
  options: {
    transformMetadata?: (file: File, projectId: string) => Record<string, unknown>;
  } = {}
) => {
  const { transformMetadata } = options;

  return createAsyncThunk(
    actionType,
    async (
      {
        projectId,
        file,
        metadata,
      }: { projectId: string; file: File; metadata?: Record<string, unknown> },
      { rejectWithValue }
    ) => {
      try {
        // const url = typeof endpoint === 'function' ? endpoint(projectId) : endpoint;
        const uploadMetadata = transformMetadata
          ? transformMetadata(file, projectId)
          : {
            project_id: projectId,
            name: file.name,
            source_type: 'file',
            ...metadata,
          };

        const response = await apiClient.uploadFile(projectId, file, uploadMetadata);
        return response.data;
      } catch (error) {
        return rejectWithValue(handleApiError(error));
      }
    }
  );
};

// ============================================================================
// PAGINATED LIST THUNK
// ============================================================================

export const createPaginatedListThunk = <TData = unknown>(
  actionType: string,
  endpoint: string | ((params: Record<string, unknown>) => string),
  options: {
    defaultPage?: number;
    defaultLimit?: number;
    transformParams?: (params: Record<string, unknown>) => Record<string, unknown>;
    transformResponse?: (data: unknown) => TData;
  } = {}
) => {
  const { defaultPage = 1, defaultLimit = 20, transformParams, transformResponse } = options;

  return createAsyncThunk(
    actionType,
    async (
      params: { page?: number; limit?: number;[key: string]: unknown } = {},
      { rejectWithValue }
    ) => {
      try {
        const queryParams = {
          page: params.page || defaultPage,
          limit: params.limit || defaultLimit,
          ...params,
        };

        const transformedParams = transformParams ? transformParams(queryParams) : queryParams;
        const response = await apiClient.get(
          typeof endpoint === 'function' ? endpoint(transformedParams) : endpoint,
          transformedParams
        );
        const result = transformResponse ? transformResponse(response.data) : response.data;
        return result;
      } catch (error) {
        return rejectWithValue(handleApiError(error));
      }
    }
  );
};

// ============================================================================
// COMMON THUNK PATTERNS FOR STORE MODULES
// ============================================================================

// Auth thunks
// Auth thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: import('../services/apiClient/types').LoginRequest, { rejectWithValue }) => {
    try {
      const response = await apiClient.login(credentials);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: import('../services/apiClient/types').RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await apiClient.register(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.getCurrentUser();
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.logout();
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Project thunks
export const fetchProjects = createPaginatedListThunk('projects/fetchProjects', '/projects');
export const createProject = createPostThunk('projects/createProject', '/projects');
export const updateProject = createPutThunk(
  'projects/updateProject',
  (params) => `/projects/${params.id}`
);
export const deleteProject = createDeleteThunk(
  'projects/deleteProject',
  (id) => `/projects/${id}`,
  { returnId: true }
);

// Data source thunks
export const uploadFile = createFileUploadThunk(
  'dataIngestion/uploadFile'
);
export const fetchUploadedFiles = createGetThunk(
  'dataIngestion/fetchFiles',
  (params?: Record<string, unknown>) => {
    const projectId = params?.projectId as string | undefined;
    if (!projectId) throw new Error('projectId is required');
    return `/projects/${projectId}/files`;
  }
);

// Reconciliation thunks
export const fetchReconciliationRecords = createPaginatedListThunk(
  'reconciliation/fetchRecords',
  (params: Record<string, unknown>) => {
    const projectId = params.projectId as string | undefined;
    if (!projectId) throw new Error('projectId is required');
    return `/projects/${projectId}/records`;
  }
);
export const runMatching = createPostThunk(
  'reconciliation/runMatching',
  '/api/reconciliation/match'
);

// Analytics thunks
export const fetchDashboardData = createGetThunk(
  'analytics/fetchDashboardData',
  '/analytics/dashboard'
);
