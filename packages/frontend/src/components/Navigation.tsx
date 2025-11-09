'use client'

import { useState } from 'react'
import Image from 'next/image'
import { 
  LogOut, 
  FolderOpen, 
  Upload, 
  GitCompare, 
  CheckCircle, 
  BarChart3, 
  FileText, 
  Download,
  Menu,
  X,
  Code,
  Shield
} from 'lucide-react'
import { useIsMobile } from '../utils/responsive'
import MobileNavigation from './MobileNavigation'

interface NavigationProps {
  onLogout: () => void
  currentProject: any
  currentPage: string
  onNavigate: (page: string) => void
}

const Navigation = ({ onLogout, currentProject, currentPage, onNavigate }: NavigationProps) => {
  const isMobile = useIsMobile()
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const navItems = [
    { path: 'projects', label: 'Projects', icon: FolderOpen },
    { path: 'ingestion', label: 'Ingestion', icon: Upload },
    { path: 'reconciliation', label: 'Reconciliation', icon: GitCompare },
    { path: 'adjudication', label: 'Adjudication', icon: CheckCircle },
    { path: 'visualization', label: 'Analytics', icon: BarChart3 },
    { path: 'presummary', label: 'Pre-Summary', icon: FileText },
    { path: 'summary', label: 'Summary & Export', icon: Download },
  ]

  // Use mobile navigation for mobile devices
  if (isMobile) {
    return (
      <MobileNavigation
        currentPage={currentPage}
        onNavigate={(path) => {
          onNavigate(path)
          setShowMobileMenu(false)
        }}
        onLogout={onLogout}
        currentProject={currentProject}
      />
    )
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Image
                src="/logo.svg"
                alt="378 Data Evidence Reconciliation"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="ml-2 text-xl font-semibold text-gray-900">
                378 Data Evidence Reconciliation
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.path
                
                return (
                  <button
                    key={item.path}
                    onClick={() => onNavigate(item.path)}
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* User Menu */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {currentProject && (
                <div className="mr-4 text-sm text-gray-500">
                  <span className="font-medium">{currentProject.name}</span>
                </div>
              )}
              <button
                onClick={onLogout}
                className="bg-gray-800 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                aria-label="Logout"
              >
                <LogOut className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {showMobileMenu ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.path
              
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    onNavigate(item.path)
                    setShowMobileMenu(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center gap-2 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              )
            })}
            <div className="border-t border-gray-200 pt-4">
              {currentProject && (
                <div className="px-3 py-2 text-sm text-gray-500">
                  <span className="font-medium">{currentProject.name}</span>
                </div>
              )}
              <button
                onClick={() => {
                  onLogout()
                  setShowMobileMenu(false)
                }}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navigation