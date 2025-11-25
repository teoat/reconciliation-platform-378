import React, { useState, useEffect } from 'react';
import { logger } from '@/services/logger';
import { useParams, useNavigate } from 'react-router-dom';
import { PageMeta } from '../seo/PageMeta';
import { apiClient } from '../../services/apiClient';
import { useProjects } from '../../hooks/useApi';
import { Button } from '../ui/Button';
import { useToast } from '../../hooks/useToast';
import { ArrowLeft } from 'lucide-react';
import { Edit } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { Upload } from 'lucide-react';
import { Play } from 'lucide-react';
import { Folder } from 'lucide-react';
import { Settings } from 'lucide-react';
import type {
  BackendProject,
  BackendDataSource,
  BackendReconciliationJob,
} from '../../services/apiClient/types';
import { getErrorMessageFromApiError } from '../../utils/errorExtraction';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { deleteProject } = useProjects();
  const toast = useToast();

  const [project, setProject] = useState<BackendProject | null>(null);
  const [dataSources, setDataSources] = useState<BackendDataSource[]>([]);
  const [jobs, setJobs] = useState<BackendReconciliationJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sources' | 'jobs'>('overview');

  useEffect(() => {
    if (id) {
      loadProjectData();
    }
  }, [id]);

  const loadProjectData = async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load project
      const projectResponse = await apiClient.getProjectById(id);
      if (projectResponse.error) {
        setError(getErrorMessageFromApiError(projectResponse.error));
        return;
      }
      setProject(projectResponse.data);

      // Load data sources
      try {
        const sourcesResponse = await apiClient.getDataSources(id);
        if (sourcesResponse.data && Array.isArray(sourcesResponse.data)) {
          setDataSources(sourcesResponse.data);
        }
      } catch (err) {
        logger.error('Failed to load data sources:', err);
        // Non-critical, continue loading
      }

      // Load reconciliation jobs
      try {
        const jobsResponse = await apiClient.getReconciliationJobs(id);
        if (jobsResponse.data && Array.isArray(jobsResponse.data)) {
          setJobs(jobsResponse.data);
        }
      } catch (err) {
        logger.error('Failed to load reconciliation jobs:', err);
        // Non-critical, continue loading
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !id ||
      !window.confirm('Are you sure you want to delete this project? This action cannot be undone.')
    ) {
      return;
    }

    try {
      const result = await deleteProject(id);
      if (result.success) {
        toast.success('Project deleted successfully');
        setTimeout(() => {
          navigate('/');
        }, 500);
      } else {
        const errorMsg = result.error || 'Failed to delete project';
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete project';
      toast.error(errorMsg);
    }
  };

  const handleStartReconciliation = () => {
    navigate(`/projects/${id}/reconciliation`);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4">Loading project...</span>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error || 'Project not found'}</p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`Project ${project?.name || id || ''}`}
        description="View project details, reconciliation status, and manage project settings."
        keywords="project, details, reconciliation, status"
      />
      <main id="main-content" className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
              {project.description && <p className="text-gray-600 mb-4">{project.description}</p>}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    project.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {project.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => navigate(`/projects/${id}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/upload', { state: { projectId: id } })}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
              <Button onClick={handleStartReconciliation}>
                <Play className="w-4 h-4 mr-2" />
                Start Reconciliation
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:border-red-300"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {(['overview', 'sources', 'jobs'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'overview' && 'Overview'}
                {tab === 'sources' && `Data Sources (${dataSources.length})`}
                {tab === 'jobs' && `Jobs (${jobs.length})`}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Data Sources</p>
                      <p className="text-2xl font-bold text-blue-600">{dataSources.length}</p>
                    </div>
                    <Folder className="w-8 h-8 text-blue-500" />
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Reconciliation Jobs</p>
                      <p className="text-2xl font-bold text-green-600">{jobs.length}</p>
                    </div>
                    <Play className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Jobs</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {
                          jobs.filter((j) => j.status === 'running' || j.status === 'pending')
                            .length
                        }
                      </p>
                    </div>
                    <Settings className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-4">
                  <Button onClick={() => navigate('/upload', { state: { projectId: id } })}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>
                  <Button onClick={handleStartReconciliation} variant="outline">
                    <Play className="w-4 h-4 mr-2" />
                    Start Reconciliation
                  </Button>
                  <Button onClick={() => navigate(`/projects/${id}/edit`)} variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Project
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sources' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Data Sources</h3>
                <Button onClick={() => navigate('/upload', { state: { projectId: id } })}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
              </div>

              {dataSources.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Folder className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="mb-4">No data sources found</p>
                  <Button onClick={() => navigate('/upload', { state: { projectId: id } })}>
                    Upload Your First File
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dataSources.map((source) => (
                    <div
                      key={source.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <h4 className="font-semibold mb-2">
                        {source.filename || source.original_filename || 'Unnamed Source'}
                      </h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Type: {source.content_type || 'Unknown'}</p>
                        {source.file_size && <p>Size: {(source.file_size / 1024).toFixed(2)} KB</p>}
                        {source.created_at && (
                          <p>Uploaded: {new Date(source.created_at).toLocaleDateString()}</p>
                        )}
                        {source.updated_at && (
                          <p>Updated: {new Date(source.updated_at).toLocaleDateString()}</p>
                        )}
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs mt-2 ${
                            source.status === 'processed' || source.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : source.status === 'processing' || source.status === 'running'
                                ? 'bg-yellow-100 text-yellow-800'
                                : source.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {source.status || 'pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'jobs' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Reconciliation Jobs</h3>
                <Button onClick={handleStartReconciliation}>
                  <Play className="w-4 h-4 mr-2" />
                  New Job
                </Button>
              </div>

              {jobs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Play className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="mb-4">No reconciliation jobs found</p>
                  <Button onClick={handleStartReconciliation}>
                    Start Your First Reconciliation
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-2">
                            Job #{job.id?.substring(0, 8) || 'Unknown'}
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>
                              Status:{' '}
                              <span
                                className={`font-medium ${
                                  job.status === 'completed'
                                    ? 'text-green-600'
                                    : job.status === 'running'
                                      ? 'text-blue-600'
                                      : job.status === 'failed'
                                        ? 'text-red-600'
                                        : 'text-gray-600'
                                }`}
                              >
                                {job.status}
                              </span>
                            </p>
                            {job.created_at && (
                              <p>Created: {new Date(job.created_at).toLocaleString()}</p>
                            )}
                            {job.started_at && (
                              <p>Started: {new Date(job.started_at).toLocaleString()}</p>
                            )}
                            {job.completed_at && (
                              <p>Completed: {new Date(job.completed_at).toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(`/projects/${id}/reconciliation?jobId=${job.id}`)
                            }
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default ProjectDetail;
