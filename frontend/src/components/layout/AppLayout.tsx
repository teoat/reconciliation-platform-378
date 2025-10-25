import React from 'react'
import { Outlet } from 'react-router-dom'
import Navigation from './Navigation'

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
