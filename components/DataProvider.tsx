'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Types
export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'draft' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface DataContextType {
  currentProject: ProjectData | null;
  setCurrentProject: (project: ProjectData | null) => void;
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: DataContextType = {
    currentProject,
    setCurrentProject,
    isLoading,
    error,
    setError,
    clearError,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export default DataProvider;
