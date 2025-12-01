// Stub implementation of apiClient to satisfy imports and allow compilation
// This file was recreated as a stub because the original was missing.

import axios from 'axios';

// Define types based on usage in asyncThunkUtils.ts
export namespace types {
  export interface LoginRequest {
    email?: string;
    password?: string;
    [key: string]: any;
  }
  export interface RegisterRequest {
    email?: string;
    password?: string;
    [key: string]: any;
  }
  export interface FileUploadRequest {
    project_id: string;
    name: string;
    source_type: string;
    [key: string]: any;
  }
}

// Create a stub axios instance
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
});

// Mock implementation of the apiClient object expected by consumers
export const apiClient = {
  get: async (url: string, params?: any) => {
    console.warn(`[Stub] apiClient.get called for ${url}`, params);
    return { data: {}, error: null };
  },
  post: async (url: string, data?: any) => {
    console.warn(`[Stub] apiClient.post called for ${url}`, data);
    return { data: {}, error: null };
  },
  put: async (url: string, data?: any) => {
    console.warn(`[Stub] apiClient.put called for ${url}`, data);
    return { data: {}, error: null };
  },
  delete: async (url: string) => {
    console.warn(`[Stub] apiClient.delete called for ${url}`);
    return { data: {}, error: null };
  },

  // Specific methods used in asyncThunkUtils
  uploadFile: async (projectId: string, file: File, metadata: types.FileUploadRequest) => {
    console.warn(`[Stub] apiClient.uploadFile called for project ${projectId}`);
    return { data: {}, error: null };
  },
  login: async (credentials: types.LoginRequest) => {
    console.warn(`[Stub] apiClient.login called`);
    return { data: { user: { id: 'stub-user' }, token: 'stub-token' }, error: null };
  },
  register: async (data: types.RegisterRequest) => {
    console.warn(`[Stub] apiClient.register called`);
    return { data: { user: { id: 'stub-user' } }, error: null };
  },
  getCurrentUser: async () => {
    console.warn(`[Stub] apiClient.getCurrentUser called`);
    return { data: { id: 'stub-user' }, error: null };
  },
  logout: async () => {
    console.warn(`[Stub] apiClient.logout called`);
    return { data: { success: true }, error: null };
  }
};

export default apiClient;
