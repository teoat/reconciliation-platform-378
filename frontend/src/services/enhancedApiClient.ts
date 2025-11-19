import type { RequestConfig, ApiResponse } from '@/types/api';

export interface RequestInterceptor {
  (config: RequestConfig): RequestConfig | Promise<RequestConfig>;
}

export interface ResponseInterceptor {
  <T = unknown>(response: ApiResponse<T>): ApiResponse<T> | Promise<ApiResponse<T>>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
