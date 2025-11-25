'use client';

import React, { useState } from 'react';
import { Menu, X, Home, FileText, Upload, BarChart3, Settings, LogOut, User } from 'lucide-react';

interface NavigationProps {
  currentProject?: { id: string; name: string } | null;
  onLogout?: () => void;
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({
  currentProject,
  onLogout,
  currentPage = 'projects',
  onNavigate,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'projects', label: 'Projects', icon: FileText },
    { id: 'ingestion', label: 'Data Ingestion', icon: Upload, requiresProject: true },
    { id: 'reconciliation', label: 'Reconciliation', icon: BarChart3, requiresProject: true },
    { id: 'cashflow-evaluation', label: 'Cashflow Evaluation', icon: BarChart3, requiresProject: true },
    { id: 'adjudication', label: 'Adjudication', icon: Settings, requiresProject: true },
    { id: 'visualization', label: 'Visualization', icon: BarChart3, requiresProject: true },
    { id: 'presummary', label: 'Presummary', icon: FileText, requiresProject: true },
    { id: 'summary', label: 'Summary & Export', icon: FileText, requiresProject: true },
  ];

  const handleNavigate = (pageId: string) => {
    if (onNavigate) {
      onNavigate(pageId);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Home className="h-6 w-6 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">
              Reconciliation Platform
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {navigationItems.map((item) => {
              const isDisabled = item.requiresProject && !currentProject;
              const isActive = currentPage === item.id;
              const Icon = item.icon;
              
              return (
                <button
                  key={item.id}
                  onClick={() => !isDisabled && handleNavigate(item.id)}
                  disabled={isDisabled}
                  className={`
                    flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-primary-100 text-primary-700'
                      : isDisabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* User Menu and Logout */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {currentProject && (
              <span className="text-sm text-gray-500">
                Project: {currentProject.name}
              </span>
            )}
            <button
              onClick={onLogout}
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => {
              const isDisabled = item.requiresProject && !currentProject;
              const isActive = currentPage === item.id;
              const Icon = item.icon;
              
              return (
                <button
                  key={item.id}
                  onClick={() => !isDisabled && handleNavigate(item.id)}
                  disabled={isDisabled}
                  className={`
                    flex items-center w-full px-3 py-2 rounded-md text-base font-medium transition-colors
                    ${isActive
                      ? 'bg-primary-100 text-primary-700'
                      : isDisabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {item.label}
                </button>
              );
            })}
            <button
              onClick={onLogout}
              className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
