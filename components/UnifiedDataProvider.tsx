'use client';

import React, { createContext, useContext, ReactNode } from 'react';

// Simple unified data hook for compatibility
export interface UnifiedDataContextType {
  isConnected: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncTime: Date | null;
}

const UnifiedDataContext = createContext<UnifiedDataContextType | undefined>(undefined);

export const useUnifiedData = (): UnifiedDataContextType => {
  const context = useContext(UnifiedDataContext);
  if (!context) {
    // Return default values if not in provider
    return {
      isConnected: true,
      syncStatus: 'idle',
      lastSyncTime: null,
    };
  }
  return context;
};

interface UnifiedDataProviderProps {
  children: ReactNode;
}

export const UnifiedDataProvider: React.FC<UnifiedDataProviderProps> = ({ children }) => {
  const value: UnifiedDataContextType = {
    isConnected: true,
    syncStatus: 'idle',
    lastSyncTime: null,
  };

  return (
    <UnifiedDataContext.Provider value={value}>
      {children}
    </UnifiedDataContext.Provider>
  );
};

export default UnifiedDataProvider;
