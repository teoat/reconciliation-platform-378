import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHealthCheck } from '../hooks/useFileReconciliation';
import { useProjects } from '../hooks/useApi';
import { apiClient } from '../services/apiClient';
import { logger } from '../services/logger';
import Button from './ui/Button';
import { PageMeta } from './seo/PageMeta';

const Dashboard: React.FC = () => {
  const { isHealthy, isChecking, lastChecked } = useHealthCheck();
  const { projects, isLoading, error, fetchProjects } = useProjects();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <>
      <PageMeta
        title="Dashboard"
        description="View and manage reconciliation projects, track progress, and analyze data in real-time."
        keywords="reconciliation, dashboard, projects, analytics"
      />
      <main id="main-content" className="max-w-6xl mx-auto" data-testid="dashboard">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Reconciliation Platform Dashboard</h1>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">System Status</h2>
        <div className="flex items-center space-x-4">
          <div
            className={`w-3 h-3 rounded-full ${
              isHealthy === true
                ? 'bg-green-500'
                : isHealthy === false
                  ? 'bg-red-500'
                  : 'bg-yellow-500'
            }`}
          ></div>
          <span className="text-lg">
            {isChecking
              ? 'Checking...'
              : isHealthy === true
                ? '✅ Backend Connected'
                : isHealthy === false
                  ? '❌ Backend Disconnected'
                  : '⏳ Checking Status'}
          </span>
          {isHealthy === false && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const response = await apiClient.healthCheck();
                  if (response.success && response.data) {
                    window.location.reload();
                  }
                } catch (error) {
                  logger.error('Health check failed:', {
                    error: error instanceof Error ? error.message : String(error),
                  });
                }
              }}
            >
              Retry Connection
            </Button>
          )}
          {lastChecked && (
            <span className="text-sm text-gray-500">
              Last checked: {lastChecked.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Projects */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Projects</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading projects...</span>
          </div>
        ) : error ? (
          <div className="text-red-600 p-4 bg-red-50 rounded" data-testid="dashboard-error">
            <div className="flex items-center justify-between">
              <span>Error: {error}</span>
              <button
                onClick={() => fetchProjects()}
                className="ml-4 text-sm text-red-700 hover:text-red-900 underline"
                aria-label="Retry loading projects"
              >
                Retry
              </button>
            </div>
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="p-4 bg-gray-50 rounded-lg border hover:border-blue-300 hover:shadow-md cursor-pointer transition-all"
              >
                <h3 className="font-medium text-lg">{project.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {project.description || 'No description'}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      project.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : project.status === 'inactive'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {project.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No projects found</p>
            <button
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() => fetchProjects()}
            >
              Refresh Projects
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            onClick={() => fetchProjects()}
          >
            Refresh Projects
          </button>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
            onClick={() => navigate('/projects/new')}
          >
            Create Project
          </button>
          <button
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
            onClick={() => navigate('/upload')}
          >
            Upload Files
          </button>
          <button
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
            onClick={() => navigate('/quick-reconciliation')}
          >
            Start Reconciliation
          </button>
          <button
            className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition-colors"
            onClick={() => navigate('/analytics')}
          >
            View Analytics
          </button>
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            onClick={() => navigate('/users')}
          >
            Manage Users
          </button>
          <button
            className="bg-cyan-500 text-white px-4 py-2 rounded hover:bg-cyan-600 transition-colors"
            onClick={() => navigate('/api-status')}
          >
            API Status
          </button>
          <button
            className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition-colors"
            onClick={() => navigate('/api-tester')}
          >
            API Tester
          </button>
          <button
            className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 transition-colors"
            onClick={() => navigate('/api-docs')}
          >
            API Docs
          </button>
        </div>
      </div>
    </main>
    </>
  );
};

export default Dashboard;
