'use client';

import { useState, useEffect } from 'react';
import {
  Server,
  Cloud,
  Zap,
  Shield,
  Key,
  Globe,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus as PlusIcon,
  Equal,
  Divide,
  Percent,
  Calculator,
  File,
  FileCheck,
  FileX,
  FilePlus,
  FileMinus,
  FileEdit,
  FileSearch,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderMinus,
  FolderCheck,
  FolderX,
  Database,
  Wifi,
  Lock,
  Unlock,
  Hash,
  Type,
  Layers,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  MoreVertical,
  Star,
  Award,
  Trophy,
  Medal,
  Flag,
  Tag,
  Bookmark,
  Share2,
  Copy,
  ExternalLink,
  Mail,
  Phone,
  User,
  UserCheck,
  UserX,
  UserPlus,
  UserMinus,
  Crown,
  Building,
  Home,
  Building2,
  Factory,
  Store,
  CreditCard,
  DollarSign,
  Euro,
  PoundSterling,
  Bitcoin,
  Bell,
  MessageSquare,
  Calendar,
  Clock,
  MapPin,
  Settings as SettingsIcon,
  X,
} from 'lucide-react';
import { useData } from '../components/DataProvider';

// API Development Interfaces
interface APIEndpoint {
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

interface APIParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  example?: unknown;
  schema: unknown;
  example?: unknown;
}

interface Webhook {
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

interface APILog {
  id: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  requestBody?: any;
  responseBody?: any;
  error?: string;
}

interface APIDevelopmentProps {
  project: any;
  onProgressUpdate?: (step: string) => void;
}

const APIDevelopment = ({ project, onProgressUpdate }: APIDevelopmentProps) => {
  const { currentProject } = useData();
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [logs, setLogs] = useState<APILog[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [showEndpointModal, setShowEndpointModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'endpoints' | 'webhooks' | 'logs' | 'documentation'>(
    'endpoints'
  );
  const [isCreating, setIsCreating] = useState(false);

  // Initialize API development
  useEffect(() => {
    initializeAPIDevelopment();
    onProgressUpdate?.('api_development_started');
  }, [currentProject, onProgressUpdate]);

  const initializeAPIDevelopment = () => {
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
            description: 'Successful response',
            schema: { type: 'object', properties: { records: { type: 'array' } } },
            example: { records: [], total: 0, page: 1 },
          },
          {
            statusCode: 401,
            description: 'Unauthorized',
            schema: { type: 'object', properties: { error: { type: 'string' } } },
          },
        ],
        authentication: 'bearer',
        rateLimit: { requests: 1000, period: 'hour' },
        status: 'active',
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        usage: {
          totalRequests: 15420,
          successRate: 99.2,
          averageResponseTime: 145,
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
            name: 'record',
            type: 'object',
            required: true,
            description: 'Reconciliation record data',
            example: { amount: 1000000, description: 'Sample transaction' },
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
        secret: 'whsec_1234567890abcdef',
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
        secret: 'whsec_abcdef1234567890',
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

  // Helper functions
  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-100 text-green-800';
      case 'POST':
        return 'bg-blue-100 text-blue-800';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'PATCH':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'deprecated':
        return 'bg-yellow-100 text-yellow-800';
      case 'beta':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusCodeColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'bg-green-100 text-green-800';
    if (statusCode >= 300 && statusCode < 400) return 'bg-blue-100 text-blue-800';
    if (statusCode >= 400 && statusCode < 500) return 'bg-yellow-100 text-yellow-800';
    if (statusCode >= 500) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleCreateEndpoint = () => {
    setIsCreating(true);
    // Simulate endpoint creation
    setTimeout(() => {
      const newEndpoint: APIEndpoint = {
        id: `endpoint-${Date.now()}`,
        name: 'New API Endpoint',
        path: '/api/v1/new-endpoint',
        method: 'GET',
        description: 'New endpoint description',
        parameters: [],
        responses: [],
        authentication: 'bearer',
        rateLimit: { requests: 100, period: 'hour' },
        status: 'beta',
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        usage: {
          totalRequests: 0,
          successRate: 0,
          averageResponseTime: 0,
        },
      };
      setEndpoints((prev) => [...prev, newEndpoint]);
      setIsCreating(false);
    }, 1000);
  };

  const handleCreateWebhook = () => {
    setIsCreating(true);
    // Simulate webhook creation
    setTimeout(() => {
      const newWebhook: Webhook = {
        id: `webhook-${Date.now()}`,
        name: 'New Webhook',
        url: 'https://example.com/webhook',
        events: [],
        secret: 'whsec_' + Math.random().toString(36).substring(2, 15),
        status: 'inactive',
        successRate: 0,
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential',
        },
        headers: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setWebhooks((prev) => [...prev, newWebhook]);
      setIsCreating(false);
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">API Development</h1>
            <p className="text-secondary-600">
              RESTful API endpoints, webhooks, and integration tools
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCreateEndpoint}
              disabled={isCreating}
              className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>New Endpoint</span>
            </button>
            <button
              onClick={handleCreateWebhook}
              disabled={isCreating}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>New Webhook</span>
            </button>
          </div>
        </div>

        {project && (
          <div className="text-sm text-primary-600 bg-primary-50 px-3 py-2 rounded-lg inline-block">
            Project: {project.name}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="card mb-6">
        <div className="border-b border-secondary-200">
          <nav className="flex space-x-8">
            {[
              { id: 'endpoints', label: 'API Endpoints', icon: Server },
              { id: 'webhooks', label: 'Webhooks', icon: Zap },
              { id: 'logs', label: 'API Logs', icon: Activity },
              { id: 'documentation', label: 'Documentation', icon: File },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Endpoints Tab */}
        {activeTab === 'endpoints' && (
          <div className="p-6">
            <div className="space-y-4">
              {endpoints.map((endpoint) => (
                <div
                  key={endpoint.id}
                  className="border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Server className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-secondary-900">{endpoint.name}</h3>
                        <p className="text-sm text-secondary-600">{endpoint.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getMethodColor(endpoint.method)}`}
                      >
                        {endpoint.method}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(endpoint.status)}`}
                      >
                        {endpoint.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-secondary-600">Path:</span>
                      <span className="ml-2 font-mono text-secondary-900">{endpoint.path}</span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Version:</span>
                      <span className="ml-2 text-secondary-900">{endpoint.version}</span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Requests:</span>
                      <span className="ml-2 text-secondary-900">
                        {endpoint.usage.totalRequests.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Success Rate:</span>
                      <span className="ml-2 text-secondary-900">
                        {endpoint.usage.successRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedEndpoint(endpoint);
                        setShowEndpointModal(true);
                      }}
                      className="btn-secondary text-sm flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </button>
                    <button className="btn-primary text-sm flex-1">
                      <Copy className="w-4 h-4 mr-1" />
                      Copy URL
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div className="p-6">
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Zap className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-secondary-900">{webhook.name}</h3>
                        <p className="text-sm text-secondary-600 font-mono">{webhook.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(webhook.status)}`}
                      >
                        {webhook.status}
                      </span>
                      <span className="text-xs text-secondary-500">
                        {webhook.successRate.toFixed(1)}% success
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-secondary-600">Events:</span>
                      <span className="ml-2 text-secondary-900">{webhook.events.length}</span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Last Triggered:</span>
                      <span className="ml-2 text-secondary-900">
                        {webhook.lastTriggered ? formatTimeAgo(webhook.lastTriggered) : 'Never'}
                      </span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Retry Policy:</span>
                      <span className="ml-2 text-secondary-900">
                        {webhook.retryPolicy.maxRetries} retries
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedWebhook(webhook);
                        setShowWebhookModal(true);
                      }}
                      className="btn-secondary text-sm flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </button>
                    <button className="btn-primary text-sm flex-1">
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Test Webhook
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="p-6">
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 border border-secondary-200 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center">
                      <Activity className="w-4 h-4 text-secondary-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getMethodColor(log.method)}`}
                        >
                          {log.method}
                        </span>
                        <span className="font-mono text-sm text-secondary-900">{log.endpoint}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-secondary-500 mt-1">
                        <span>{log.ipAddress}</span>
                        <span>{log.responseTime}ms</span>
                        <span>{formatTimeAgo(log.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusCodeColor(log.statusCode)}`}
                    >
                      {log.statusCode}
                    </span>
                    <button className="text-secondary-400 hover:text-secondary-600">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documentation Tab */}
        {activeTab === 'documentation' && (
          <div className="p-6">
            <div className="space-y-6">
              <div className="text-center py-8">
                <File className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-secondary-900 mb-2">API Documentation</h3>
                <p className="text-secondary-600 mb-4">
                  Interactive API documentation with examples and testing tools
                </p>
                <button className="btn-primary">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Documentation Portal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Endpoint Detail Modal */}
      {showEndpointModal && selectedEndpoint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-secondary-900">{selectedEndpoint.name}</h3>
              <button
                onClick={() => setShowEndpointModal(false)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-secondary-900 mb-4">
                  Endpoint Information
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Method</span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getMethodColor(selectedEndpoint.method)}`}
                    >
                      {selectedEndpoint.method}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Path</span>
                    <span className="font-mono text-sm text-secondary-900">
                      {selectedEndpoint.path}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Version</span>
                    <span className="text-sm text-secondary-900">{selectedEndpoint.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Status</span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedEndpoint.status)}`}
                    >
                      {selectedEndpoint.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Authentication</span>
                    <span className="text-sm text-secondary-900">
                      {selectedEndpoint.authentication}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-secondary-900 mb-4">Usage Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Total Requests</span>
                    <span className="text-sm text-secondary-900">
                      {selectedEndpoint.usage.totalRequests.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Success Rate</span>
                    <span className="text-sm text-secondary-900">
                      {selectedEndpoint.usage.successRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">
                      Avg Response Time
                    </span>
                    <span className="text-sm text-secondary-900">
                      {selectedEndpoint.usage.averageResponseTime}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Rate Limit</span>
                    <span className="text-sm text-secondary-900">
                      {selectedEndpoint.rateLimit.requests} per {selectedEndpoint.rateLimit.period}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-semibold text-secondary-900 mb-4">Parameters</h4>
              <div className="space-y-2">
                {selectedEndpoint.parameters.map((param) => (
                  <div key={param.name} className="p-3 bg-secondary-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-secondary-900">{param.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-secondary-600">{param.type}</span>
                        {param.required && (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-secondary-600">{param.description}</p>
                    {param.example && (
                      <p className="text-xs text-secondary-500 mt-1">
                        Example: {JSON.stringify(param.example)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-semibold text-secondary-900 mb-4">Responses</h4>
              <div className="space-y-2">
                {selectedEndpoint.responses.map((response) => (
                  <div key={response.statusCode} className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusCodeColor(response.statusCode)}`}
                      >
                        {response.statusCode}
                      </span>
                      <span className="text-sm text-blue-900">{response.description}</span>
                    </div>
                    {response.example && (
                      <pre className="text-xs text-blue-700 mt-2 bg-blue-100 p-2 rounded">
                        {JSON.stringify(response.example, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default APIDevelopment;
