import React, { useState, useEffect } from 'react'
import { X, Menu } from 'lucide-react'

export interface SidebarProps {
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
  title?: string
  className?: string
  overlay?: boolean
  position?: 'left' | 'right'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const Sidebar: React.FC<SidebarProps> = ({
  children,
  isOpen,
  onClose,
  title,
  className = '',
  overlay = true,
  position = 'right',
  size = 'md'
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      document.body.style.overflow = 'hidden'
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300)
      document.body.style.overflow = 'unset'
      return () => clearTimeout(timer)
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const sizeClasses = {
    sm: 'w-64',
    md: 'w-80',
    lg: 'w-96',
    xl: 'w-[28rem]'
  }

  const positionClasses = {
    left: 'left-0',
    right: 'right-0'
  }

  const transformClasses = {
    left: isOpen ? 'translate-x-0' : '-translate-x-full',
    right: isOpen ? 'translate-x-0' : 'translate-x-full'
  }

  if (!isVisible) return null

  return (
    <>
      {/* Overlay */}
      {overlay && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClose}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onClose()
            }
          }}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 ${positionClasses[position]} h-full bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${sizeClasses[size]} ${transformClasses[position]} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sidebar-title' : undefined}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 id="sidebar-title" className="text-lg font-semibold text-gray-900">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}

export interface SidebarTriggerProps {
  onClick: () => void
  className?: string
  children?: React.ReactNode
}

export const SidebarTrigger: React.FC<SidebarTriggerProps> = ({
  onClick,
  className = '',
  children
}) => {
  return (
    <button
      onClick={onClick}
      className={`p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md ${className}`}
      aria-label="Open sidebar"
    >
      {children || <Menu className="h-5 w-5" />}
    </button>
  )
}
