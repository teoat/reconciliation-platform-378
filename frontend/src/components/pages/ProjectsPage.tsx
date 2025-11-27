import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../hooks/useApi';
import Button from '../ui/Button';
import { EnhancedContextualHelp } from '../ui/EnhancedContextualHelp';

const ProjectsPage: React.FC = () => {
  const { projects, isLoading, error, fetchProjects } = useProjects();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  if (isLoading) {
    return (
      <div className="projects-page p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="projects-page p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Projects</h2>
          <p className="text-red-600">{error}</p>
          <Button
            variant="outline"
            onClick={() => fetchProjects()}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="projects-page p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <EnhancedContextualHelp
            feature="projects"
            trigger="click"
            position="bottom"
          />
        </div>
        <Button
          onClick={() => navigate('/projects/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Create New Project
        </Button>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/projects/${project.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/projects/${project.id}`);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`View project ${project.name}`}
            >
              <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
              {project.description && (
                <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
              )}
              <div className="flex items-center justify-between">
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    project.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : project.status === 'draft'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {project.status}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/projects/${project.id}`);
                  }}
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <h2 className="text-xl font-semibold mb-2">No Projects Found</h2>
          <p className="text-gray-600 mb-6">
            Get started by creating your first reconciliation project.
          </p>
          <Button
            onClick={() => navigate('/projects/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Create Your First Project
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
