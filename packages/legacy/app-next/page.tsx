'use client'

import { useState, useEffect } from 'react'
import { ProjectInfo, User } from '../frontend/src/types/backend-aligned'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './store'
import ErrorBoundary from './utils/ErrorBoundary'
import Navigation from './components/Navigation'
import DataProvider from './components/DataProvider'
import { FrenlyProvider, useFrenly } from './components/FrenlyProvider'
import FrenlyAI from './components/FrenlyAI'
import { 
  AuthPage, 
  ProjectSelectionPage, 
  IngestionPage, 
  ReconciliationPage, 
  AdjudicationPage, 
  VisualizationPage, 
  PresummaryPage, 
  CashflowEvaluationPage, 
  SummaryExportPage 
} from './pages'

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentProject, setCurrentProject] = useState<ProjectInfo | null>(null)
  const [currentPage, setCurrentPage] = useState<string>('projects')
  const { state: frenlyState, updateProgress } = useFrenly()

  useEffect(() => {
    // Check if user is authenticated (in a real app, this would check localStorage or API)
    const authStatus = localStorage.getItem('auth')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (user: User) => {
    setIsAuthenticated(true)
    localStorage.setItem('auth', 'true')
    localStorage.setItem('user', JSON.stringify(user))
    updateProgress('authentication_completed')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('auth')
    setCurrentProject(null)
    setCurrentPage('projects')
    updateProgress('logout_completed')
  }

  const handleProjectSelect = (project: ProjectInfo) => {
    setCurrentProject(project)
    setCurrentPage('ingestion')
    updateProgress('project_selected')
  }

  const handleNavigation = (page: string) => {
    setCurrentPage(page)
    updateProgress(`navigated_to_${page}`)
  }

  const handleProgressUpdate = (step: string) => {
    console.log('Progress updated:', step)
    updateProgress(step)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AuthPage />
        <FrenlyAI />
      </div>
    )
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'projects':
        return (
          <ProjectSelectionPage
            onProjectSelect={handleProjectSelect}
          />
        )
      case 'ingestion':
        return (
          <IngestionPage />
        )
      case 'reconciliation':
        return (
          <ReconciliationPage />
        )
      case 'cashflow-evaluation':
        return (
          <CashflowEvaluationPage />
        )
      case 'adjudication':
        return (
          <AdjudicationPage />
        )
      case 'visualization':
        return (
          <VisualizationPage />
        )
      case 'presummary':
        return (
          <PresummaryPage />
        )
      case 'summary':
        return (
          <SummaryExportPage />
        )
      default:
        return (
          <ProjectSelectionPage
            onProjectSelect={handleProjectSelect}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        currentProject={currentProject}
        onLogout={handleLogout}
        currentPage={currentPage}
        onNavigate={handleNavigation}
      />
      
      <main className="flex-1">
        {renderCurrentPage()}
      </main>

      {/* Frenly AI Component - Always visible on authenticated pages */}
      <FrenlyAI />
    </div>
  )
}

function AppWithFrenly() {
  return (
    <FrenlyProvider>
      <AppContent />
    </FrenlyProvider>
  )
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
  )
}