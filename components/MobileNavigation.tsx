'use client'

import { useState } from 'react'
import Image from 'next/image'
import { 
  Home, 
  FolderOpen, 
  Upload, 
  RefreshCw, 
  CheckCircle, 
  BarChart3, 
  FileText, 
  Download,
  Settings,
  User,
  Bell,
  Search,
  Menu,
  X
} from 'lucide-react'
import { useIsMobile, useBreakpoint } from '../utils/responsive'

interface MobileNavigationProps {
  currentPage: string
  onNavigate: (page: string) => void
  onLogout: () => void
  currentProject?: any
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentPage,
  onNavigate,
  onLogout,
  currentProject
}) => {
  const isMobile = useIsMobile()
  const { breakpoint } = useBreakpoint()
  const [showMenu, setShowMenu] = useState(false)

  const navigationItems = [
    { id: '/projects', label: 'Projects', icon: FolderOpen, page: 'projects' },
    { id: '/ingestion', label: 'Ingestion', icon: Upload, page: 'ingestion' },
    { id: '/reconciliation', label: 'Reconcile', icon: RefreshCw, page: 'reconciliation' },
    { id: '/adjudication', label: 'Adjudicate', icon: CheckCircle, page: 'adjudication' },
    { id: '/visualization', label: 'Visualize', icon: BarChart3, page: 'visualization' },
    { id: '/presummary', label: 'Pre-Summary', icon: FileText, page: 'presummary' },
    { id: '/summary', label: 'Summary', icon: Download, page: 'summary' }
  ]

  const handleNavigation = (page: string) => {
    onNavigate(page)
    setShowMenu(false)
  }

  if (!isMobile) return null

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <Image 
              src="/logos/logo-compact.svg" 
              alt="378 Data and Evidence Reconciliation App" 
              width={24}
              height={24}
              className="h-6 w-auto"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="p-2 text-gray-400 hover:text-gray-600"
              title="Search"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              className="p-2 text-gray-400 hover:text-gray-600"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex items-center justify-around py-2">
          {navigationItems.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={`flex flex-col items-center space-y-1 p-2 min-w-0 flex-1 ${
                currentPage === item.id 
                  ? 'text-primary-600' 
                  : 'text-gray-500'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => setShowMenu(true)}
            className="flex flex-col items-center space-y-1 p-2 min-w-0 flex-1 text-gray-500"
          >
            <Menu className="w-5 h-5" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Navigation</h3>
              <button
                onClick={() => setShowMenu(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
                title="Close menu"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left ${
                    currentPage === item.id 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <button
                  onClick={() => {
                    setShowMenu(false)
                    // Handle settings
                  }}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg text-left text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Settings</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowMenu(false)
                    onLogout()
                  }}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg text-left text-red-600 hover:bg-red-50"
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <Image 
              src="/logos/logo-compact.svg" 
              alt="378 Data and Evidence Reconciliation App" 
              width={24}
              height={24}
              className="h-6 w-auto"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              className="p-2 text-gray-500 hover:text-gray-700"
              title="Search"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button 
              className="p-2 text-gray-500 hover:text-gray-700"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Content Spacer */}
      <div className="h-16" /> {/* Top spacer for header */}
      <div className="h-16" /> {/* Bottom spacer for navigation */}
    </>
  )
}

export default MobileNavigation
