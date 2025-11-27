// API Development Types
// Extracted from APIDevelopment.tsx

export interface APIEndpoint {
  id: string;
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  parameters: APIParameter[];
  responses: APIResponse[];
  authentication: 'none' | 'api_key' | 'bearer' | 'oauth';
  rateLimit: {
    requests: number;
    period: 'minute' | 'hour' | 'day';
  };
  status: 'active' | 'deprecated' | 'beta';
  version: string;
  lastUpdated: string;
  usage: {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
  };
}

export interface APIParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  example?: unknown;
  validation?: string;
}

export interface APIResponse {
  statusCode: number;
  description: string;
  schema: Record<string, unknown>;
  example?: unknown;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  status: 'active' | 'inactive' | 'error';
  lastTriggered?: string;
  successRate: number;
  retryPolicy: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential';
  };
  headers: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface APILog {
  id: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  requestBody?: Record<string, unknown>;
  responseBody?: Record<string, unknown>;
  error?: string;
}

export interface Project {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface APIDevelopmentProps {
  project: Project;
  onProgressUpdate?: (step: string) => void;
}

export type APITab = 'endpoints' | 'webhooks' | 'logs' | 'documentation';

