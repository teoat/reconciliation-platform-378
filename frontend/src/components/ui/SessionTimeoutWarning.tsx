import React, { useEffect, useState } from 'react'
import { AlertTriangle, Clock } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface SessionTimeoutWarningProps {
  remainingMinutes: number
  onExtend: () => void
  onLogout: () => void
}

export const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({
  remainingMinutes,
  onExtend,
  onLogout,
}) => {
  const [countdown, setCountdown] = useState(remainingMinutes)

  // Update countdown when remainingMinutes prop changes
  useEffect(() => {
    setCountdown(remainingMinutes)
  }, [remainingMinutes])

  // Decrement countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 0) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
          Session Expiring Soon
        </h2>
        
        <p className="text-gray-600 mb-4 text-center">
          Your session will expire in{' '}
          <span className="font-semibold text-gray-900">
            {countdown} minute{countdown !== 1 ? 's' : ''}
          </span>
          . Would you like to stay logged in?
        </p>
        
        <div className="flex items-center justify-center mb-6">
          <Clock className="w-5 h-5 text-gray-400 mr-2" />
          <span className="text-sm text-gray-500">
            Click "Stay Logged In" to extend your session
          </span>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onExtend}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Stay Logged In
          </button>
          <button
            onClick={onLogout}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook to use session timeout warning
export const useSessionTimeoutWarning = () => {
  const { logout } = useAuth()
  const [showWarning, setShowWarning] = useState(false)
  const [remainingMinutes, setRemainingMinutes] = useState(5)

  useEffect(() => {
    const handleWarning = (event: CustomEvent<{ remainingMinutes: number }>) => {
      setRemainingMinutes(event.detail.remainingMinutes)
      setShowWarning(true)
    }

    window.addEventListener('session-timeout-warning', handleWarning as (e: Event) => void)

    return () => {
      window.removeEventListener('session-timeout-warning', handleWarning as (e: Event) => void)
    }
  }, [])

  const handleExtend = () => {
    // Get the current session timeout manager and extend it
    // This would need to be exposed from useAuth or stored globally
    const event = new CustomEvent('extend-session')
    window.dispatchEvent(event)
    setShowWarning(false)
  }

  const handleLogout = async () => {
    setShowWarning(false)
    await logout()
  }

  return {
    showWarning,
    remainingMinutes,
    handleExtend,
    handleLogout,
  }
}

