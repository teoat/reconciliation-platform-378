// Tier 0 Persistent UI Shell - Always renders immediately
// Ensures users ALWAYS see structure before any data loads
// Eliminates blank flash completely

import React from 'react'
import UnifiedNavigation from './UnifiedNavigation'
import { SkeletonDashboard } from '../ui/LoadingSpinner'
import NotificationSystem from '../../store/NotificationSystem'
import { SkipLinks } from '../accessibility/SkipLinks'

interface AppShellProps {
  children: React.ReactNode
  showSkeleton?: boolean
}

/**
 * Tier 0 AppShell Component
 * 
 * Renders immediately with persistent layout structure, ensuring:
 * - Navigation is always visible
 * - Skeleton screens show content structure
 * - Zero blank flash during data loading
 * - Progressive enhancement as data loads
 */
export const AppShell: React.FC<AppShellProps> = ({ 
  children, 
  showSkeleton = false 
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip links for accessibility */}
      <SkipLinks />
      
      {/* Tier 0: Always visible navigation */}
      <UnifiedNavigation />
      
      {/* Tier 1+: Progressive content loading */}
      <main id="main-content" role="main" aria-label="Main content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showSkeleton ? (
          <SkeletonDashboard />
        ) : (
          children
        )}
      </main>
      
      {/* Tier 0: Notification system (always available) */}
      <NotificationSystem />
    </div>
  )
}

export default AppShell

