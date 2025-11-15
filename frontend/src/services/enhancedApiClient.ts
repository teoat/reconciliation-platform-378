export interface RequestInterceptor {
  (config: any): any;
}

export interface ResponseInterceptor {
  (response: any): any;
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
