
export interface ApiRequestConfig {
  headers?: Record<string, string>;
  method?: string;
  url?: string;
  body?: unknown;
  startTime?: number;
}
