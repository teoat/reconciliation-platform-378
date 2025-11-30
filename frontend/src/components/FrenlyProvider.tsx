import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FrenlyState {
  isActive: boolean;
  progress: number;
  currentStep: string;
}

interface FrenlyContextType {
  state: FrenlyState;
  updateProgress: (progress: number, step?: string) => void;
  toggleActive: () => void;
}

const FrenlyContext = createContext<FrenlyContextType | undefined>(undefined);

interface FrenlyProviderProps {
  children: ReactNode;
}

export const FrenlyProvider: React.FC<FrenlyProviderProps> = ({ children }) => {
  const [state, setState] = useState<FrenlyState>({
    isActive: false,
    progress: 0,
    currentStep: 'Welcome',
  });

  const updateProgress = (progress: number, step?: string) => {
    setState((prev) => ({
      ...prev,
      progress,
      currentStep: step || prev.currentStep,
    }));
  };

  const toggleActive = () => {
    setState((prev) => ({ ...prev, isActive: !prev.isActive }));
  };

  return (
    <FrenlyContext.Provider value={{ state, updateProgress, toggleActive }}>
      {children}
    </FrenlyContext.Provider>
  );
};

export const useFrenly = () => {
  const context = useContext(FrenlyContext);
  if (context === undefined) {
    throw new Error('useFrenly must be used within a FrenlyProvider');
  }
  return context;
};
