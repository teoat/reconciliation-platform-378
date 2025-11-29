'use client'

import { useState, useEffect } from 'react'
import { 
  Code, 
  Globe, 
  Zap, 
  Shield, 
  Database, 
  Webhook, 
  Download, 
  Upload,
  Play,
  Pause,
  Settings,
  Key,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react'

interface ApiPageProps {
  project: Record<string, unknown>
}

// API Interfaces
interface ApiEndpoint {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  description: string
  parameters: ApiParameter[]
  responses: ApiResponse[]
  rateLimit: number
  authentication: 'none' | 'api_key' | 'oauth' | 'jwt'
  tags: string[]
  isActive: boolean
}

interface ApiParameter {
  name: string
  type: string
  required: boolean
  description: string
  example?: unknown
}

interface ApiResponse {
  status: number
  description: string
  schema: Record<string, unknown>
  example?: unknown
}

interface WebhookEvent {
  id: string
  name: string
  description: string
  eventType: string
  payload: Record<string, unknown>
  isActive: boolean
  subscribers: number
}

interface ApiKey {
  id: string
  name: string
  key: string
  permissions: string[]
  rateLimit: number
  expiresAt?: string
  lastUsed?: string
  isActive: boolean
}

interface Integration {
  id: string
  name: string
  type: 'erp' | 'banking' | 'accounting' | 'custom'
  status: 'active' | 'inactive' | 'error'
  lastSync: string
  syncFrequency: string
  dataFlow: 'inbound' | 'outbound' | 'bidirectional'
  endpoints: string[]
}

const ApiPage = ({ project }: ApiPageProps) => {
  const [activeTab, setActiveTab] = useState<'endpoints' | 'webhooks' | 'keys' | 'integrations' | 'docs'>('endpoints')
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([])
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showWebhookModal, setShowWebhookModal] = useState(false)
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null)

  // Initialize sample data
  useEffect(() => {
    const endpoints: ApiEndpoint[] = [
      {
        id: 'endpoint-1',
        method: 'GET',
        path: '/api/v1/reconciliations',
        description: 'Retrieve reconciliation records with filtering and pagination',
        parameters: [
          { name: 'page', type: 'integer', required: false, description: 'Page number', example: 1 },
          { name: 'limit', type: 'integer', required: false, description: 'Records per page', example: 20 },
          { name: 'status', type: 'string', required: false, description: 'Filter by status', example: 'matched' },
          { name: 'date_from', type: 'string', required: false, description: 'Start date filter', example: '2023-12-01' }
        ],
        responses: [
          { status: 200, description: 'Success', schema: { type: 'object' }, example: { data: [], total: 0 } },
          { status: 400, description: 'Bad Request', schema: { type: 'object' } },
          { status: 401, description: 'Unauthorized', schema: { type: 'object' } }
        ],
        rateLimit: 1000,
        authentication: 'api_key',
        tags: ['reconciliations', 'data'],
        isActive: true
      },
      {
        id: 'endpoint-2',
        method: 'POST',
        path: '/api/v1/reconciliations',
        description: 'Create a new reconciliation record',
        parameters: [
          { name: 'system_a_data', type: 'object', required: true, description: 'Data from system A' },
          { name: 'system_b_data', type: 'object', required: true, description: 'Data from system B' },
          { name: 'matching_rules', type: 'array', required: false, description: 'Custom matching rules' }
        ],
        responses: [
          { status: 201, description: 'Created', schema: { type: 'object' } },
          { status: 400, description: 'Validation Error', schema: { type: 'object' } }
        ],
        rateLimit: 100,
        authentication: 'api_key',
        tags: ['reconciliations', 'create'],
        isActive: true
      },
      {
        id: 'endpoint-3',
        method: 'GET',
        path: '/api/v1/discrepancies',
        description: 'Get discrepancy records with advanced filtering',
        parameters: [
          { name: 'priority', type: 'string', required: false, description: 'Filter by priority', example: 'high' },
          { name: 'assigned_to', type: 'string', required: false, description: 'Filter by assignee' },
          { name: 'workflow_status', type: 'string', required: false, description: 'Filter by workflow status' }
        ],
        responses: [
          { status: 200, description: 'Success', schema: { type: 'object' } }
        ],
        rateLimit: 500,
        authentication: 'api_key',
        tags: ['discrepancies', 'workflow'],
        isActive: true
      }
    ]

    const webhooks: WebhookEvent[] = [
      {
        id: 'webhook-1',
        name: 'Reconciliation Completed',
        description: 'Triggered when a reconciliation process is completed',
        eventType: 'reconciliation.completed',
        payload: { reconciliation_id: 'string', status: 'string', timestamp: 'string' },
        isActive: true,
        subscribers: 5
      },
      {
        id: 'webhook-2',
        name: 'Discrepancy Created',
        description: 'Triggered when a new discrepancy is detected',
        eventType: 'discrepancy.created',
        payload: { discrepancy_id: 'string', priority: 'string', amount: 'number' },
        isActive: true,
        subscribers: 3
      },
      {
        id: 'webhook-3',
        name: 'Workflow Status Changed',
        description: 'Triggered when workflow status changes',
        eventType: 'workflow.status_changed',
        payload: { workflow_id: 'string', old_status: 'string', new_status: 'string' },
        isActive: false,
        subscribers: 2
      }
    ]

    const keys: ApiKey[] = [
      {
        id: 'key-1',
        name: 'Production API Key',
        key: 'sk-prod-placeholder',
        permissions: ['read', 'write', 'admin'],
        rateLimit: 10000,
        expiresAt: '2024-12-31T23:59:59Z',
        lastUsed: '2023-12-15T14:30:00Z',
        isActive: true
      },
      {
        id: 'key-2',
        name: 'Development API Key',
        key: 'sk-dev-placeholder',
        permissions: ['read'],
        rateLimit: 1000,
        lastUsed: '2023-12-14T09:15:00Z',
        isActive: true
      }
    ]

    const integrationData: Integration[] = [
      {
        id: 'integration-1',
        name: 'SAP ERP Integration',
        type: 'erp',
        status: 'active',
        lastSync: '2023-12-15T10:30:00Z',
        syncFrequency: 'hourly',
        dataFlow: 'bidirectional',
        endpoints: ['/api/v1/sap/transactions', '/api/v1/sap/accounts']
      },
      {
        id: 'integration-2',
        name: 'Bank API Integration',
        type: 'banking',
        status: 'active',
        lastSync: '2023-12-15T10:25:00Z',
        syncFrequency: 'daily',
        dataFlow: 'inbound',
        endpoints: ['/api/v1/bank/statements']
      },
      {
        id: 'integration-3',
        name: 'QuickBooks Integration',
        type: 'accounting',
        status: 'error',
        lastSync: '2023-12-14T15:45:00Z',
        syncFrequency: 'daily',
        dataFlow: 'bidirectional',
        endpoints: ['/api/v1/quickbooks/invoices']
      }
    ]

    setApiEndpoints(endpoints)
    setWebhookEvents(webhooks)
    setApiKeys(keys)
    setIntegrations(integrationData)
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const generateApiKey = () => {
    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name: 'New API Key',
      key: `sk-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      permissions: ['read'],
      rateLimit: 1000,
      isActive: true
    }
    setApiKeys(prev => [...prev, newKey])
  }

  const toggleWebhook = (webhookId: string) => {
    setWebhookEvents(prev => prev.map(w => 
      w.id === webhookId ? { ...w, isActive: !w.isActive } : w
    ))
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          API & Integration Management
        </h1>
        <p className="text-secondary-600">
          Manage API endpoints, webhooks, integrations, and developer resources
        </p>
        {project && (
          <div className="mt-2 text-sm text-primary-600">
            Project: {project.name}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'endpoints'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Code className="w-4 h-4 mr-2 inline" />
            API Endpoints
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'webhooks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Webhook className="w-4 h-4 mr-2 inline" />
            Webhooks
          </button>
          <button
            onClick={() => setActiveTab('keys')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'keys'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Key className="w-4 h-4 mr-2 inline" />
            API Keys
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'integrations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Globe className="w-4 h-4 mr-2 inline" />
            Integrations
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'docs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Database className="w-4 h-4 mr-2 inline" />
            Documentation
          </button>
        </nav>
      </div>

      {/* API Endpoints Tab */}
      {activeTab === 'endpoints' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">API Endpoints</h3>
              <div className="flex space-x-2">
                <button className="btn-secondary flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Export OpenAPI</span>
                </button>
                <button className="btn-primary flex items-center space-x-2">
                  <Code className="w-4 h-4" />
                  <span>Add Endpoint</span>
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {apiEndpoints.map((endpoint) => (
                <div key={endpoint.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                        endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                        endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                        endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {endpoint.method}
                      </span>
                      <code className="text-sm font-mono text-gray-900">{endpoint.path}</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        endpoint.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {endpoint.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => setSelectedEndpoint(endpoint)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View details"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{endpoint.description}</p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Rate Limit: {endpoint.rateLimit}/hour</span>
                    <span>Auth: {endpoint.authentication}</span>
                    <span>Tags: {endpoint.tags.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">Webhook Events</h3>
              <button
                onClick={() => setShowWebhookModal(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Webhook className="w-4 h-4" />
                <span>Create Webhook</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {webhookEvents.map((webhook) => (
                <div key={webhook.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{webhook.name}</h4>
                      <p className="text-sm text-gray-600">{webhook.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleWebhook(webhook.id)}
                        className={`px-3 py-1 text-sm rounded-md ${
                          webhook.isActive 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {webhook.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Event Type:</span>
                      <code className="ml-2 text-gray-600">{webhook.eventType}</code>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Subscribers:</span>
                      <span className="ml-2 text-gray-600">{webhook.subscribers}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <span className={`ml-2 ${webhook.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                        {webhook.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'keys' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">API Keys</h3>
              <button
                onClick={generateApiKey}
                className="btn-primary flex items-center space-x-2"
              >
                <Key className="w-4 h-4" />
                <span>Generate New Key</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div key={key.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{key.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <code className="text-sm font-mono text-gray-600">{key.key}</code>
                        <button
                          onClick={() => copyToClipboard(key.key)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Copy key"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        key.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {key.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Permissions:</span>
                      <span className="ml-2 text-gray-600">{key.permissions.join(', ')}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Rate Limit:</span>
                      <span className="ml-2 text-gray-600">{key.rateLimit}/hour</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Last Used:</span>
                      <span className="ml-2 text-gray-600">
                        {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">System Integrations</h3>
              <button className="btn-primary flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>Add Integration</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {integrations.map((integration) => (
                <div key={integration.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{integration.name}</h4>
                      <p className="text-sm text-gray-600 capitalize">{integration.type} • {integration.dataFlow}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        integration.status === 'active' ? 'bg-green-100 text-green-800' :
                        integration.status === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {integration.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Last Sync:</span>
                      <span className="ml-2 text-gray-600">
                        {new Date(integration.lastSync).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Frequency:</span>
                      <span className="ml-2 text-gray-600 capitalize">{integration.syncFrequency}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Endpoints:</span>
                      <span className="ml-2 text-gray-600">{integration.endpoints.length}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Documentation Tab */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">API Documentation</h3>
            <div className="prose max-w-none">
              <h4>Getting Started</h4>
              <p>Our REST API provides programmatic access to reconciliation data and functionality.</p>
              
              <h4>Base URL</h4>
              <code className="bg-gray-100 p-2 rounded">https://api.reconciliation.com/v1</code>
              
              <h4>Authentication</h4>
              <p>All API requests require authentication using API keys. Include your API key in the request header:</p>
              <code className="bg-gray-100 p-2 rounded">Authorization: Bearer YOUR_API_KEY</code>
              
              <h4>Rate Limits</h4>
              <p>API requests are rate limited per API key. Standard limits are:</p>
              <ul>
                <li>Production keys: 10,000 requests/hour</li>
                <li>Development keys: 1,000 requests/hour</li>
              </ul>
              
              <h4>SDK Libraries</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h5 className="font-semibold">JavaScript/Node.js</h5>
                  <code className="text-sm">npm install reconciliation-sdk</code>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h5 className="font-semibold">Python</h5>
                  <code className="text-sm">pip install reconciliation-sdk</code>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h5 className="font-semibold">Java</h5>
                  <code className="text-sm">mvn install reconciliation-sdk</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApiPage



