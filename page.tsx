'use client';

import { useState, useEffect, Suspense } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import { ErrorBoundary } from './utils/errorHandler';
import Navigation from './components/Navigation';
import DataProvider from './components/DataProvider';
import { FrenlyProvider, useFrenly } from './components/FrenlyProvider';
import FrenlyAI from './components/FrenlyAI';
import { lazy } from 'react';
import { pwaService } from './services/pwaService';
import PWAInstallPrompt from './components/PWAInstallPrompt';

// Lazy load pages for better performance
const AuthPage = lazy(() => import('./pages/AuthPage'));
const ProjectSelectionPage = lazy(() => import('./pages/ProjectSelectionPage'));
const IngestionPage = lazy(() => import('./pages/IngestionPage'));
const ReconciliationPage = lazy(() => import('./pages/ReconciliationPage'));
const AdjudicationPage = lazy(() => import('./pages/AdjudicationPage'));
const VisualizationPage = lazy(() => import('./pages/VisualizationPage'));
const PresummaryPage = lazy(() => import('./pages/PresummaryPage'));
const CashflowEvaluationPage = lazy(() => import('./pages/CashflowEvaluationPage'));
const SummaryExportPage = lazy(() => import('./pages/SummaryExportPage'));

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<string>('projects');
  const { state: frenlyState, updateProgress } = useFrenly();

  useEffect(() => {
    // TEMPORARILY DISABLED FOR TESTING: Bypass authentication
    // Check if user is authenticated (in a real app, this would check localStorage or API)
    const authStatus = localStorage.getItem('auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    } else {
      // TEMPORARY: Auto-authenticate for testing purposes
      setIsAuthenticated(true);
      localStorage.setItem('auth', 'true');
      localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com', name: 'Test User' }));
    }

    // Initialize PWA service (auto-initializes on import)
    console.log('PWA service initialized');
  }, []);

  const handleLogin = (user: any) => {
    setIsAuthenticated(true);
    localStorage.setItem('auth', 'true');
    localStorage.setItem('user', JSON.stringify(user));
    updateProgress('authentication_completed');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('auth');
    setCurrentProject(null);
    setCurrentPage('projects');
    updateProgress('logout_completed');
  };

  const handleProjectSelect = (project: any) => {
    setCurrentProject(project);
    setCurrentPage('ingestion');
    updateProgress('project_selected');
  };

  const handleNavigation = (page: string) => {
    setCurrentPage(page);
    updateProgress(`navigated_to_${page}`);
  };

  const handleProgressUpdate = (step: string) => {
    console.log('Progress updated:', step);
    updateProgress(step);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AuthPage onLogin={handleLogin} />
        <FrenlyAI
          currentPage="/auth"
          userProgress={{
            completedSteps: [],
            currentStep: 'authentication',
            totalSteps: 8,
          }}
        />
      </div>
    );
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'projects':
        return <ProjectSelectionPage onProjectSelect={handleProjectSelect} />;
      case 'ingestion':
        return <IngestionPage project={currentProject} />;
      case 'reconciliation':
        return (
          <ReconciliationPage project={currentProject} onProgressUpdate={handleProgressUpdate} />
        );
      case 'cashflow-evaluation':
        return (
          <CashflowEvaluationPage
            project={currentProject}
            onProgressUpdate={handleProgressUpdate}
          />
        );
      case 'adjudication':
        return <AdjudicationPage project={currentProject} />;
      case 'visualization':
        return <VisualizationPage project={currentProject} />;
      case 'presummary':
        return <PresummaryPage project={currentProject} />;
      case 'summary':
        return <SummaryExportPage project={currentProject} />;
      default:
        return <ProjectSelectionPage onProjectSelect={handleProjectSelect} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        currentProject={currentProject}
        onLogout={handleLogout}
        currentPage={currentPage}
        onNavigate={handleNavigation}
      />

      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          }
        >
          {renderCurrentPage()}
        </Suspense>
      </main>

      {/* Frenly AI Component - Always visible on authenticated pages */}
      <FrenlyAI
        currentPage={frenlyState.currentPage}
        userProgress={frenlyState.userProgress}
        onAction={(action) => {
          console.log('Frenly AI action:', action);
          // Handle Frenly AI actions here
        }}
      />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}

function AppWithFrenly() {
  return (
    <FrenlyProvider>
      <AppContent />
    </FrenlyProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
          <DataProvider>
            <AppWithFrenly />
          </DataProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}
