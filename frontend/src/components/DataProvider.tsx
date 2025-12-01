import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DataContextType {
  projects: any[];
  currentProject: any;
  setCurrentProject: (project: any) => void;
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [projects, setProjects] = useState<unknown[]>([]);
  const [currentProject, setCurrentProject] = useState<unknown>(null);
  const [loading, _setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load projects from localStorage or API
    const loadProjects = () => {
      try {
        const savedProjects = localStorage.getItem('projects');
        if (savedProjects) {
          setProjects(JSON.parse(savedProjects));
        } else {
          // Default projects for demo
          const defaultProjects = [
            { id: 1, name: 'Sample Project 1', description: 'Demo project' },
            { id: 2, name: 'Sample Project 2', description: 'Another demo project' },
          ];
          setProjects(defaultProjects);
          localStorage.setItem('projects', JSON.stringify(defaultProjects));
        }
      } catch (err) {
        setError('Failed to load projects');
      }
    };

    loadProjects();
  }, []);

  const value: DataContextType = {
    projects,
    currentProject,
    setCurrentProject,
    loading,
    error,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export default DataProvider;
