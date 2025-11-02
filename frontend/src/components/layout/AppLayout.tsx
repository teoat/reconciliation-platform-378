import React from 'react';
import { Outlet } from 'react-router-dom';
import UnifiedNavigation from './UnifiedNavigation';
import { SkipLink } from '@/components/ui/Accessibility';
import { memo } from 'react';

/**
 * AppLayout Component
 * Main application layout with semantic HTML structure
 * Includes skip links for accessibility
 */
const AppLayout: React.FC = memo(() => {
  return (
    <div className="min-h-screen bg-gray-50">
      <SkipLink />

      <UnifiedNavigation />

      <main id="main-content" className="flex-1" role="main" aria-label="Main content">
        <Outlet />
      </main>
    </div>
  );
});

AppLayout.displayName = 'AppLayout';

export default AppLayout;
