import { memo, useMemo, useRef, useEffect } from 'react';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority_score: number;
  smart_recommendations: string[];
}

interface SmartDashboardProjectCardProps {
  project: Project;
}

/**
 * Project Card Component for Smart Dashboard
 * Optimized with React.memo to prevent unnecessary re-renders
 */
export const SmartDashboardProjectCard = memo<SmartDashboardProjectCardProps>(({ project }) => {
  const statusClasses = useMemo(() => {
    switch (project.status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, [project.status]);

  const progressPercentage = useMemo(
    () => Math.round(project.priority_score * 100),
    [project.priority_score]
  );

  // Use ref to set width directly via DOM to avoid inline style warnings
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.style.width = `${progressPercentage}%`;
    }
  }, [progressPercentage]);

  // ARIA attributes as object to avoid linter false positives
  const ariaProps = useMemo(
    () => ({
      'aria-valuenow': progressPercentage,
      'aria-valuemin': 0,
      'aria-valuemax': 100,
    }),
    [progressPercentage]
  );

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{project.name}</h3>
          {project.description && (
            <p className="text-sm text-gray-600 mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full ${statusClasses}`}>
            {project.status}
          </span>
          <span className="text-sm font-medium text-blue-600">
            {Math.round(project.priority_score * 100)}%
          </span>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>Priority Score</span>
          <span>{Math.round(project.priority_score * 100)}%</span>
        </div>
        <div 
          className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden" 
          role="progressbar" 
          aria-label={`Priority score: ${progressPercentage}%`}
          {...ariaProps}
        >
          <div
            ref={progressBarRef}
            className="absolute inset-y-0 left-0 h-full rounded-full bg-blue-500 transition-all duration-300 ease-out"
            aria-hidden="true"
          />
        </div>
      </div>

      {project.smart_recommendations.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium text-gray-700 mb-1">Recommendations:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            {project.smart_recommendations.slice(0, 2).map((rec, i) => (
              <li key={i}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

SmartDashboardProjectCard.displayName = 'SmartDashboardProjectCard';

