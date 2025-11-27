// API Data Hook
// Extracted from APIDevelopment.tsx

import { useState, useEffect } from 'react';
import type { APIEndpoint, Webhook, APILog, Project } from '../types';

interface UseAPIDataOptions {
  project?: Project;
  onProgressUpdate?: (step: string) => void;
}

export function useAPIData({ project, onProgressUpdate }: UseAPIDataOptions) {
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [logs, setLogs] = useState<APILog[]>([]);

  useEffect(() => {
    initializeAPIData();
    onProgressUpdate?.('api_development_started');
  }, [project, onProgressUpdate]);

  const initializeAPIData = () => {
    // Initialize sample endpoints
    const sampleEndpoints: APIEndpoint[] = [
      {
        id: 'endpoint-001',
        name: 'Get Reconciliation Records',
        path: '/api/v1/reconciliation/records',
        method: 'GET',
        description: 'Retrieve paginated list of reconciliation records',
        parameters: [
          {
            name: 'page',
            type: 'number',
            required: false,
            description: 'Page number for pagination',
            example: 1,
          },
          {
            name: 'limit',
            type: 'number',
            required: false,
            description: 'Number of records per page',
            example: 50,
          },
          {
            name: 'status',
            type: 'string',
            required: false,
            description: 'Filter by reconciliation status',
            example: 'matched',
          },
        ],
        responses: [
          {
            statusCode: 200,
            description: 'Records retrieved successfully',
            schema: { type: 'object', properties: { records: { type: 'array' } } },
          },
        ],
        authentication: 'bearer',
        rateLimit: { requests: 1000, period: 'hour' },
        status: 'active',
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        usage: {
          totalRequests: 5432,
          successRate: 99.2,
          averageResponseTime: 156,
        },
      },
      {
        id: 'endpoint-002',
        name: 'Create Reconciliation Record',
        path: '/api/v1/reconciliation/records',
        method: 'POST',
        description: 'Create a new reconciliation record',
        parameters: [
          {
            name: 'amount',
            type: 'number',
            required: true,
            description: 'Transaction amount',
            example: 1000000,
          },
          {
            name: 'description',
            type: 'string',
            required: false,
            description: 'Transaction description',
            example: 'Payment for services',
          },
        ],
        responses: [
          {
            statusCode: 201,
            description: 'Record created successfully',
            schema: { type: 'object', properties: { id: { type: 'string' } } },
          },
          {
            statusCode: 400,
            description: 'Bad request',
            schema: { type: 'object', properties: { error: { type: 'string' } } },
          },
        ],
        authentication: 'bearer',
        rateLimit: { requests: 100, period: 'hour' },
        status: 'active',
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        usage: {
          totalRequests: 2340,
          successRate: 97.8,
          averageResponseTime: 89,
        },
      },
      {
        id: 'endpoint-003',
        name: 'Get Cashflow Analysis',
        path: '/api/v1/cashflow/analysis',
        method: 'GET',
        description: 'Retrieve cashflow analysis data',
        parameters: [
          {
            name: 'dateRange',
            type: 'string',
            required: false,
            description: 'Date range for analysis',
            example: '2024-01-01,2024-01-31',
          },
        ],
        responses: [
          {
            statusCode: 200,
            description: 'Analysis data retrieved',
            schema: { type: 'object', properties: { categories: { type: 'array' } } },
          },
        ],
        authentication: 'bearer',
        rateLimit: { requests: 500, period: 'hour' },
        status: 'active',
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        usage: {
          totalRequests: 890,
          successRate: 98.5,
          averageResponseTime: 234,
        },
      },
    ];

    // Initialize sample webhooks
    const sampleWebhooks: Webhook[] = [
      {
        id: 'webhook-001',
        name: 'Reconciliation Status Update',
        url: 'https://external-system.com/webhooks/reconciliation',
        events: ['reconciliation.completed', 'reconciliation.failed'],
        secret: 'whsec_placeholder_1',
        status: 'active',
        lastTriggered: new Date(Date.now() - 300000).toISOString(),
        successRate: 98.5,
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential',
        },
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Reconciliation-API/1.0',
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'webhook-002',
        name: 'Discrepancy Alert',
        url: 'https://monitoring.company.com/alerts',
        events: ['discrepancy.detected', 'discrepancy.resolved'],
        secret: 'whsec_placeholder_2',
        status: 'active',
        lastTriggered: new Date(Date.now() - 600000).toISOString(),
        successRate: 99.1,
        retryPolicy: {
          maxRetries: 5,
          backoffStrategy: 'linear',
        },
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'monitoring-key-123',
        },
        createdAt: '2024-01-05T00:00:00Z',
        updatedAt: new Date().toISOString(),
      },
    ];

    // Initialize sample logs
    const sampleLogs: APILog[] = [
      {
        id: 'log-001',
        endpoint: '/api/v1/reconciliation/records',
        method: 'GET',
        statusCode: 200,
        responseTime: 145,
        timestamp: new Date(Date.now() - 60000).toISOString(),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        requestBody: { page: 1, limit: 50 },
        responseBody: { records: [], total: 0 },
      },
      {
        id: 'log-002',
        endpoint: '/api/v1/reconciliation/records',
        method: 'POST',
        statusCode: 201,
        responseTime: 89,
        timestamp: new Date(Date.now() - 120000).toISOString(),
        ipAddress: '192.168.1.101',
        userAgent: 'PostmanRuntime/7.28.4',
        requestBody: { amount: 1000000, description: 'Test transaction' },
        responseBody: { id: 'rec-123', status: 'created' },
      },
      {
        id: 'log-003',
        endpoint: '/api/v1/cashflow/analysis',
        method: 'GET',
        statusCode: 500,
        responseTime: 1200,
        timestamp: new Date(Date.now() - 180000).toISOString(),
        ipAddress: '192.168.1.102',
        userAgent: 'curl/7.68.0',
        error: 'Internal server error: Database connection timeout',
      },
    ];

    setEndpoints(sampleEndpoints);
    setWebhooks(sampleWebhooks);
    setLogs(sampleLogs);
  };

  return {
    endpoints,
    webhooks,
    logs,
    setEndpoints,
    setWebhooks,
    setLogs,
  };
}

