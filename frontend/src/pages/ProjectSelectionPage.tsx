import React, { useState, useEffect } from 'react';

interface Project {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'draft';
  createdAt: string;
  updatedAt: string;
}

interface ProjectSelectionPageProps {
  onProjectSelect: (project: Project) => void;
}

const ProjectSelectionPage: React.FC<ProjectSelectionPageProps> = ({ onProjectSelect }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load projects - in a real app, this would come from an API
    const loadProjects = () => {
      setTimeout(() => {
        const mockProjects: Project[] = [
          {
            id: 1,
            name: 'Q4 Financial Reconciliation',
            description: 'Quarterly financial statement reconciliation for Q4 2024',
            status: 'active',
            createdAt: '2024-11-01',
            updatedAt: '2024-11-15',
          },
          {
            id: 2,
            name: 'Vendor Payment Matching',
            description: 'Match vendor invoices with payment records',
            status: 'draft',
            createdAt: '2024-11-10',
            updatedAt: '2024-11-10',
          },
          {
            id: 3,
            name: 'Inventory Audit',
            description: 'Reconcile physical inventory with system records',
            status: 'completed',
            createdAt: '2024-10-01',
            updatedAt: '2024-10-30',
          },
        ];
        setProjects(mockProjects);
        setLoading(false);
      }, 1000);
    };

    loadProjects();
  }, []);

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Select a Project</h1>
          <p className="mt-2 text-gray-600">
            Choose an existing project to continue working, or create a new one.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onProjectSelect(project)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onProjectSelect(project);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {project.status}
                  </span>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>

                <div className="text-sm text-gray-500">
                  <p>Created: {new Date(project.createdAt).toLocaleDateString()}</p>
                  <p>Last updated: {new Date(project.updatedAt).toLocaleDateString()}</p>
                </div>

                <button
                  className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onProjectSelect(project);
                  }}
                >
                  Open Project
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-lg font-medium">
            + Create New Project
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectSelectionPage;
