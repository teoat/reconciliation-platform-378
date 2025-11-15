// Mobile Responsive Utilities and Hooks
import { useState, useEffect } from 'react'

export interface BreakpointConfig {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
}

export const defaultBreakpoints: BreakpointConfig = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}

export type Breakpoint = keyof BreakpointConfig

// Hook to detect current breakpoint
export const useBreakpoint = (breakpoints: BreakpointConfig = defaultBreakpoints) => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('xs')
  const [windowSize, setWindowSize] = useState<number>(0)

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      setWindowSize(width)

      if (width >= breakpoints['2xl']) {
        setBreakpoint('2xl')
      } else if (width >= breakpoints.xl) {
        setBreakpoint('xl')
      } else if (width >= breakpoints.lg) {
        setBreakpoint('lg')
      } else if (width >= breakpoints.md) {
        setBreakpoint('md')
      } else if (width >= breakpoints.sm) {
        setBreakpoint('sm')
      } else {
        setBreakpoint('xs')
      }
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [breakpoints])

  return { breakpoint, windowSize }
}

// Hook to detect if device is mobile
export const useIsMobile = () => {
  const { breakpoint } = useBreakpoint()
  return breakpoint === 'xs' || breakpoint === 'sm'
}

// Hook to detect if device is tablet
export const useIsTablet = () => {
  const { breakpoint } = useBreakpoint()
  return breakpoint === 'md'
}

// Hook to detect if device is desktop
export const useIsDesktop = () => {
  const { breakpoint } = useBreakpoint()
  return breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl'
}

// Hook to detect touch capability
export const useIsTouch = () => {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  return isTouch
}

// Hook to detect device orientation
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    updateOrientation()
    window.addEventListener('resize', updateOrientation)
    return () => window.removeEventListener('resize', updateOrientation)
  }, [])

  return orientation
}

// Utility functions for responsive design
export const getResponsiveClasses = (breakpoint: Breakpoint) => {
  const classes = {
    xs: {
      grid: 'grid-cols-1',
      padding: 'p-2',
      text: 'text-sm',
      spacing: 'space-y-2'
    },
    sm: {
      grid: 'grid-cols-1 sm:grid-cols-2',
      padding: 'p-3',
      text: 'text-sm',
      spacing: 'space-y-3'
    },
    md: {
      grid: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      padding: 'p-4',
      text: 'text-base',
      spacing: 'space-y-4'
    },
    lg: {
      grid: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      padding: 'p-6',
      text: 'text-base',
      spacing: 'space-y-6'
    },
    xl: {
      grid: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      padding: 'p-6',
      text: 'text-lg',
      spacing: 'space-y-6'
    },
    '2xl': {
      grid: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
      padding: 'p-8',
      text: 'text-lg',
      spacing: 'space-y-8'
    }
  }

  return classes[breakpoint]
}

// Mobile-specific utility functions
export const getMobileClasses = () => ({
  container: 'px-4 py-2',
  card: 'p-3 rounded-lg',
  button: 'px-4 py-2 text-sm',
  input: 'px-3 py-2 text-sm',
  modal: 'mx-2 max-h-[90vh]',
  table: 'text-xs',
  grid: 'grid-cols-1 gap-3'
})

export const getTabletClasses = () => ({
  container: 'px-6 py-4',
  card: 'p-4 rounded-lg',
  button: 'px-6 py-2 text-base',
  input: 'px-4 py-2 text-base',
  modal: 'mx-4 max-h-[85vh]',
  table: 'text-sm',
  grid: 'grid-cols-2 gap-4'
})

export const getDesktopClasses = () => ({
  container: 'px-8 py-6',
  card: 'p-6 rounded-lg',
  button: 'px-8 py-3 text-base',
  input: 'px-4 py-3 text-base',
  modal: 'mx-8 max-h-[80vh]',
  table: 'text-base',
  grid: 'grid-cols-3 gap-6'
})

// Touch-specific utilities
export const getTouchClasses = () => ({
  button: 'min-h-[44px] min-w-[44px]', // iOS recommended touch target
  input: 'min-h-[44px]',
  link: 'min-h-[44px] flex items-center',
  card: 'cursor-pointer'
})

// Responsive grid utilities
export const getResponsiveGrid = (breakpoint: Breakpoint, itemCount: number) => {
  const gridClasses = {
    xs: 'grid-cols-1',
    sm: itemCount >= 2 ? 'grid-cols-2' : 'grid-cols-1',
    md: itemCount >= 3 ? 'grid-cols-3' : itemCount >= 2 ? 'grid-cols-2' : 'grid-cols-1',
    lg: itemCount >= 4 ? 'grid-cols-4' : itemCount >= 3 ? 'grid-cols-3' : itemCount >= 2 ? 'grid-cols-2' : 'grid-cols-1',
    xl: itemCount >= 5 ? 'grid-cols-5' : itemCount >= 4 ? 'grid-cols-4' : itemCount >= 3 ? 'grid-cols-3' : itemCount >= 2 ? 'grid-cols-2' : 'grid-cols-1',
    '2xl': itemCount >= 6 ? 'grid-cols-6' : itemCount >= 5 ? 'grid-cols-5' : itemCount >= 4 ? 'grid-cols-4' : itemCount >= 3 ? 'grid-cols-3' : itemCount >= 2 ? 'grid-cols-2' : 'grid-cols-1'
  }

  return gridClasses[breakpoint]
}

// Mobile navigation utilities
export const getMobileNavigationClasses = () => ({
  container: 'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50',
  nav: 'flex items-center justify-around py-2',
  item: 'flex flex-col items-center space-y-1 p-2',
  icon: 'w-6 h-6',
  label: 'text-xs font-medium',
  active: 'text-primary-600',
  inactive: 'text-gray-500'
})

// Mobile modal utilities
export const getMobileModalClasses = () => ({
  overlay: 'fixed inset-0 bg-black bg-opacity-50 z-50',
  container: 'fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4',
  content: 'bg-white rounded-t-lg sm:rounded-lg w-full max-h-[90vh] overflow-y-auto',
  header: 'flex items-center justify-between p-4 border-b border-gray-200',
  body: 'p-4',
  footer: 'flex items-center justify-end space-x-2 p-4 border-t border-gray-200'
})

// Mobile form utilities
export const getMobileFormClasses = () => ({
  container: 'space-y-4',
  field: 'space-y-2',
  label: 'block text-sm font-medium text-gray-700',
  input: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
  textarea: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none',
  select: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
  button: 'w-full sm:w-auto px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  buttonSecondary: 'w-full sm:w-auto px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
})

// Mobile table utilities
export const getMobileTableClasses = () => ({
  container: 'overflow-x-auto',
  table: 'w-full border-collapse',
  header: 'bg-gray-50',
  headerCell: 'px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
  row: 'border-b border-gray-200 hover:bg-gray-50',
  cell: 'px-3 py-2 text-sm text-gray-900',
  mobileCard: 'bg-white border border-gray-200 rounded-lg p-4 mb-3',
  mobileCardHeader: 'flex items-center justify-between mb-2',
  mobileCardTitle: 'font-medium text-gray-900',
  mobileCardSubtitle: 'text-sm text-gray-500',
  mobileCardContent: 'space-y-2'
})

// Mobile-specific component variants
export const getMobileComponentVariants = () => ({
  card: {
    mobile: 'p-3 rounded-lg shadow-sm border border-gray-200',
    tablet: 'p-4 rounded-lg shadow-md border border-gray-200',
    desktop: 'p-6 rounded-lg shadow-lg border border-gray-200'
  },
  button: {
    mobile: 'px-4 py-2 text-sm font-medium rounded-md',
    tablet: 'px-6 py-2 text-base font-medium rounded-md',
    desktop: 'px-8 py-3 text-base font-medium rounded-lg'
  },
  input: {
    mobile: 'px-3 py-2 text-sm border border-gray-300 rounded-md',
    tablet: 'px-4 py-2 text-base border border-gray-300 rounded-md',
    desktop: 'px-4 py-3 text-base border border-gray-300 rounded-lg'
  }
})
