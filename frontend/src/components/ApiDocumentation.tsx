import React, { useState } from 'react';
import {
  BookOpen,
  Database,
  Users,
  BarChart3,
  Settings,
  Copy,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';
import { StatusBadge } from './ui/StatusBadge';
import { PageMeta } from './seo/PageMeta';

interface ApiDocumentationProps {
  className?: string;
}

interface ApiEndpoint {
  method: string;
  endpoint: string;
  description: string;
}

const ApiDocumentation: React.FC<ApiDocumentationProps> = ({ className = '' }) => {
  const [selectedSection, setSelectedSection] = useState('overview');

  const sections = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'authentication', label: 'Authentication', icon: Users },
    { id: 'projects', label: 'Projects', icon: Database },
    { id: 'reconciliation', label: 'Reconciliation', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'websocket', label: 'WebSocket', icon: Settings },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const apiEndpoints = {
    authentication: [
      {
        method: 'POST',
        endpoint: '/auth/login',
        description: 'Authenticate user and get access token',
        request: {
          email: 'string',
          password: 'string',
        },
        response: {
          token: 'string',
          user: 'User object',
          expires_at: 'number',
        },
      },
      {
        method: 'POST',
        endpoint: '/auth/register',
        description: 'Register new user account',
        request: {
          email: 'string',
          password: 'string',
          first_name: 'string',
          last_name: 'string',
          role: 'string (optional)',
        },
        response: {
          token: 'string',
          user: 'User object',
          expires_at: 'number',
        },
      },
      {
        method: 'GET',
        endpoint: '/auth/me',
        description: 'Get current user information',
        request: 'None (requires authentication)',
        response: 'User object',
      },
      {
        method: 'POST',
        endpoint: '/auth/logout',
        description: 'Logout user and invalidate token',
        request: 'None (requires authentication)',
        response: 'Success message',
      },
    ],
    projects: [
      {
        method: 'GET',
        endpoint: '/projects',
        description: 'Get list of projects',
        request: {
          page: 'number (optional)',
          per_page: 'number (optional)',
          search: 'string (optional)',
          status: 'string (optional)',
        },
        response: {
          data: 'Array of Project objects',
          pagination: 'Pagination object',
        },
      },
      {
        method: 'GET',
        endpoint: '/projects/{id}',
        description: 'Get project by ID',
        request: 'None (requires authentication)',
        response: 'Project object',
      },
      {
        method: 'POST',
        endpoint: '/projects',
        description: 'Create new project',
        request: {
          name: 'string',
          description: 'string (optional)',
          settings: 'object (optional)',
          status: 'string (optional)',
        },
        response: 'Project object',
      },
      {
        method: 'PUT',
        endpoint: '/projects/{id}',
        description: 'Update project',
        request: {
          name: 'string (optional)',
          description: 'string (optional)',
          settings: 'object (optional)',
          status: 'string (optional)',
          is_active: 'boolean (optional)',
        },
        response: 'Project object',
      },
      {
        method: 'DELETE',
        endpoint: '/projects/{id}',
        description: 'Delete project',
        request: 'None (requires authentication)',
        response: 'Success message',
      },
    ],
    reconciliation: [
      {
        method: 'GET',
        endpoint: '/projects/{id}/data-sources',
        description: 'Get data sources for project',
        request: 'None (requires authentication)',
        response: 'Array of DataSource objects',
      },
      {
        method: 'POST',
        endpoint: '/projects/{id}/data-sources/upload',
        description: 'Upload file to project',
        request: 'FormData with file and metadata',
        response: 'DataSource object',
      },
      {
        method: 'POST',
        endpoint: '/projects/{id}/data-sources/{source_id}/process',
        description: 'Process uploaded file',
        request: 'None (requires authentication)',
        response: 'Processing result',
      },
      {
        method: 'GET',
        endpoint: '/projects/{id}/reconciliation-records',
        description: 'Get reconciliation records',
        request: {
          page: 'number (optional)',
          per_page: 'number (optional)',
          status: 'string (optional)',
          search: 'string (optional)',
        },
        response: {
          data: 'Array of ReconciliationRecord objects',
          pagination: 'Pagination object',
        },
      },
      {
        method: 'GET',
        endpoint: '/projects/{id}/reconciliation-matches',
        description: 'Get reconciliation matches',
        request: {
          page: 'number (optional)',
          per_page: 'number (optional)',
          status: 'string (optional)',
          min_confidence: 'number (optional)',
          max_confidence: 'number (optional)',
        },
        response: {
          data: 'Array of ReconciliationMatch objects',
          pagination: 'Pagination object',
        },
      },
      {
        method: 'POST',
        endpoint: '/projects/{id}/reconciliation-matches',
        description: 'Create reconciliation match',
        request: {
          record_a_id: 'string',
          record_b_id: 'string',
          confidence_score: 'number',
          status: 'string (optional)',
        },
        response: 'ReconciliationMatch object',
      },
      {
        method: 'PUT',
        endpoint: '/projects/{id}/reconciliation-matches/{match_id}',
        description: 'Update reconciliation match',
        request: {
          status: 'string (optional)',
          confidence_score: 'number (optional)',
          reviewed_by: 'string (optional)',
        },
        response: 'ReconciliationMatch object',
      },
      {
        method: 'GET',
        endpoint: '/projects/{id}/reconciliation-jobs',
        description: 'Get reconciliation jobs',
        request: 'None (requires authentication)',
        response: 'Array of ReconciliationJob objects',
      },
      {
        method: 'POST',
        endpoint: '/projects/{id}/reconciliation-jobs',
        description: 'Create reconciliation job',
        request: {
          settings: 'object (optional)',
          priority: 'string (optional)',
          description: 'string (optional)',
        },
        response: 'ReconciliationJob object',
      },
      {
        method: 'POST',
        endpoint: '/projects/{id}/reconciliation-jobs/{job_id}/start',
        description: 'Start reconciliation job',
        request: 'None (requires authentication)',
        response: 'ReconciliationJob object',
      },
      {
        method: 'POST',
        endpoint: '/projects/{id}/reconciliation-jobs/{job_id}/stop',
        description: 'Stop reconciliation job',
        request: 'None (requires authentication)',
        response: 'ReconciliationJob object',
      },
    ],
    analytics: [
      {
        method: 'GET',
        endpoint: '/analytics/dashboard',
        description: 'Get dashboard analytics data',
        request: 'None (requires authentication)',
        response: 'DashboardData object',
      },
      {
        method: 'GET',
        endpoint: '/analytics/projects/{id}/stats',
        description: 'Get project statistics',
        request: 'None (requires authentication)',
        response: 'ProjectStats object',
      },
      {
        method: 'GET',
        endpoint: '/analytics/reconciliation/stats',
        description: 'Get reconciliation statistics',
        request: 'None (requires authentication)',
        response: 'ReconciliationStats object',
      },
    ],
  };

  const renderEndpoint = (endpoint: ApiEndpoint, index: number) => (
    <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <StatusBadge
            status={
              endpoint.method === 'GET'
                ? 'active'
                : endpoint.method === 'POST'
                  ? 'warning'
                  : endpoint.method === 'PUT'
                    ? 'warning'
                    : 'inactive'
            }
          >
            {endpoint.method}
          </StatusBadge>
          <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
            {endpoint.endpoint}
          </code>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => copyToClipboard(`${endpoint.method} ${endpoint.endpoint}`)}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-sm text-gray-700 mb-3">{endpoint.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Request</h4>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
            <code>{JSON.stringify(endpoint.request, null, 2)}</code>
          </pre>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Response</h4>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
            <code>{JSON.stringify(endpoint.response, null, 2)}</code>
          </pre>
        </div>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (selectedSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">API Overview</h2>
              <p className="text-gray-700 mb-6">
                The Reconciliation Platform API provides comprehensive endpoints for managing
                projects, data sources, reconciliation processes, and analytics. All endpoints
                require authentication except for health checks and authentication endpoints.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Database className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold">Base URL</h3>
                  </div>
                  <code className="text-sm bg-gray-100 p-2 rounded block">
                    {import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}
                  </code>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold">Authentication</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    Bearer token authentication. Include the token in the Authorization header:
                  </p>
                  <code className="text-xs bg-gray-100 p-2 rounded block mt-2">
                    Authorization: Bearer {'{token}'}
                  </code>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900">User Management</h4>
                <p className="text-sm text-gray-600">
                  CRUD operations for users and authentication
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Database className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900">Project Management</h4>
                <p className="text-sm text-gray-600">Create and manage reconciliation projects</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900">Reconciliation</h4>
                <p className="text-sm text-gray-600">File processing and matching algorithms</p>
              </div>
            </div>
          </div>
        );

      case 'websocket':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">WebSocket API</h2>
              <p className="text-gray-700 mb-6">
                Real-time communication for live updates, notifications, and collaboration features.
              </p>
            </div>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Connection</h3>
                <code className="text-sm bg-gray-100 p-2 rounded block mb-4">
                  {import.meta.env.VITE_WS_URL || 'ws://localhost:2000'}
                </code>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Connection with Authentication
                    </h4>
                    <code className="text-sm bg-gray-100 p-2 rounded block">
                      ws://localhost:2000?token={'{your_token}'}
                    </code>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Message Format</h4>
                    <pre className="text-sm bg-gray-100 p-2 rounded">
                      {`{
  "type": "event_type",
  "data": {
    "key": "value"
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Event Types</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <code className="text-sm font-mono">reconciliation:progress</code>
                      <p className="text-xs text-gray-600">Job progress updates</p>
                    </div>
                    <StatusBadge status="active">Real-time</StatusBadge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <code className="text-sm font-mono">reconciliation:completed</code>
                      <p className="text-xs text-gray-600">Job completion notifications</p>
                    </div>
                    <StatusBadge status="active">Real-time</StatusBadge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <code className="text-sm font-mono">user:presence</code>
                      <p className="text-xs text-gray-600">User activity updates</p>
                    </div>
                    <StatusBadge status="active">Real-time</StatusBadge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <code className="text-sm font-mono">notification:new</code>
                      <p className="text-xs text-gray-600">New notification alerts</p>
                    </div>
                    <StatusBadge status="active">Real-time</StatusBadge>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {sections.find((s) => s.id === selectedSection)?.label} API
              </h2>
              <p className="text-gray-700 mb-6">
                Complete API reference for {selectedSection} endpoints.
              </p>
            </div>

            {apiEndpoints[selectedSection as keyof typeof apiEndpoints]?.map((endpoint, index) =>
              renderEndpoint(endpoint, index)
            )}
          </div>
        );
    }
  };

  return (
    <>
      <PageMeta
        title="API Documentation"
        description="Complete API documentation with endpoints, parameters, and examples."
        keywords="API, documentation, endpoints, reference, integration"
      />
      <main id="main-content" className={`max-w-7xl mx-auto ${className}`}>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">API Documentation</h1>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">API Reference</h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedSection === section.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <section.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{section.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <div className="p-6">{renderSection()}</div>
          </Card>
        </div>
      </div>
    </main>
    </>
  );
};

export default ApiDocumentation;
