import React from 'react'
import { useSessionTimeoutWarning, SessionTimeoutWarning } from './ui/SessionTimeoutWarning'

// Component to handle session timeout warnings
export const SessionTimeoutHandler: React.FC = () => {
  const { showWarning, remainingMinutes, handleExtend, handleLogout } = useSessionTimeoutWarning()

  if (!showWarning) return null

  return (
    <SessionTimeoutWarning
      remainingMinutes={remainingMinutes}
      onExtend={handleExtend}
      onLogout={handleLogout}
    />
  )
}

