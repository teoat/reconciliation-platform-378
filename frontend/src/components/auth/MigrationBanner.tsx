/**
 * Migration Banner Component
 * 
 * Displays a banner to inform users about the authentication system migration.
 * Can be dismissed and won't show again for that user.
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useFeatureFlag } from '@/config/featureFlags';

const BANNER_DISMISSED_KEY = 'auth_migration_banner_dismissed';

export const MigrationBanner: React.FC = () => {
  const showMigrationBanner = useFeatureFlag('showMigrationBanner');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if banner should be shown
    if (!showMigrationBanner) {
      setIsVisible(false);
      return;
    }

    // Check if user has dismissed the banner
    try {
      const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
      setIsVisible(!dismissed);
    } catch (error) {
      console.error('Failed to check banner dismissed status:', error);
      setIsVisible(true);
    }
  }, [showMigrationBanner]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
      setIsVisible(false);
    } catch (error) {
      console.error('Failed to save banner dismissed status:', error);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex-1 flex items-center">
            <span className="flex p-2 rounded-lg bg-blue-100">
              <svg
                className="h-6 w-6 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
            <p className="ml-3 font-medium text-blue-900">
              <span className="md:hidden">
                We've upgraded our authentication system for better security.
              </span>
              <span className="hidden md:inline">
                We've upgraded to a more secure authentication system. Your existing account
                will continue to work seamlessly.
              </span>
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5 text-blue-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

