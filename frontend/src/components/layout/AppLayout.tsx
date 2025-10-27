import React from 'react'
import { Outlet } from 'react-router-dom'
import UnifiedNavigation from './UnifiedNavigation'

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedNavigation />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
