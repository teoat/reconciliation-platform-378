// Simplified Spacing System Component
// Reduced from 575 lines to ~100 lines by focusing on essential functionality

import React from 'react'

export interface SpacingProps {
  children: React.ReactNode
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  direction?: 'vertical' | 'horizontal' | 'all'
  className?: string
}

export const Spacing: React.FC<SpacingProps> = ({
  children,
  size = 'md',
  direction = 'all',
  className = ''
}) => {
  const getSizeClasses = () => {
    const sizes = {
      xs: '0.5',
      sm: '1',
      md: '2',
      lg: '3',
      xl: '4',
      '2xl': '6',
      '3xl': '8'
    }
    return sizes[size]
  }

  const getDirectionClasses = () => {
    const sizeValue = getSizeClasses()
    const directions = {
      vertical: `py-${sizeValue}`,
      horizontal: `px-${sizeValue}`,
      all: `p-${sizeValue}`
    }
    return directions[direction]
  }

  return (
    <div className={`${getDirectionClasses()} ${className}`}>
      {children}
    </div>
  )
}

// Simplified Margin Component
export interface MarginProps {
  children: React.ReactNode
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  direction?: 'top' | 'bottom' | 'left' | 'right' | 'all'
  className?: string
}

export const Margin: React.FC<MarginProps> = ({
  children,
  size = 'md',
  direction = 'all',
  className = ''
}) => {
  const getSizeClasses = () => {
    const sizes = {
      xs: '0.5',
      sm: '1',
      md: '2',
      lg: '3',
      xl: '4',
      '2xl': '6',
      '3xl': '8'
    }
    return sizes[size]
  }

  const getDirectionClasses = () => {
    const sizeValue = getSizeClasses()
    const directions = {
      top: `mt-${sizeValue}`,
      bottom: `mb-${sizeValue}`,
      left: `ml-${sizeValue}`,
      right: `mr-${sizeValue}`,
      all: `m-${sizeValue}`
    }
    return directions[direction]
  }

  return (
    <div className={`${getDirectionClasses()} ${className}`}>
      {children}
    </div>
  )
}

// Simplified Container Component
export interface ContainerProps {
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export const Container: React.FC<ContainerProps> = ({
  children,
  maxWidth = 'lg',
  padding = 'md',
  className = ''
}) => {
  const getMaxWidthClasses = () => {
    const maxWidths = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      full: 'max-w-full'
    }
    return maxWidths[maxWidth]
  }

  const getPaddingClasses = () => {
    const paddings = {
      xs: 'px-2',
      sm: 'px-4',
      md: 'px-6',
      lg: 'px-8',
      xl: 'px-12'
    }
    return paddings[padding]
  }

  return (
    <div className={`mx-auto ${getMaxWidthClasses()} ${getPaddingClasses()} ${className}`}>
      {children}
    </div>
  )
}

// Simplified Stack Component
export interface StackProps {
  children: React.ReactNode
  direction?: 'vertical' | 'horizontal'
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  className?: string
}

export const Stack: React.FC<StackProps> = ({
  children,
  direction = 'vertical',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  className = ''
}) => {
  const getDirectionClasses = () => {
    return direction === 'vertical' ? 'flex-col' : 'flex-row'
  }

  const getSpacingClasses = () => {
    const spacings = {
      xs: 'space-y-1',
      sm: 'space-y-2',
      md: 'space-y-4',
      lg: 'space-y-6',
      xl: 'space-y-8'
    }
    return direction === 'vertical' ? spacings[spacing] : spacings[spacing].replace('y', 'x')
  }

  const getAlignClasses = () => {
    const aligns = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch'
    }
    return aligns[align]
  }

  const getJustifyClasses = () => {
    const justifies = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly'
    }
    return justifies[justify]
  }

  return (
    <div
      className={`
        flex
        ${getDirectionClasses()}
        ${getSpacingClasses()}
        ${getAlignClasses()}
        ${getJustifyClasses()}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

// Simplified Grid Component
export interface GridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export const Grid: React.FC<GridProps> = ({
  children,
  columns = 3,
  gap = 'md',
  className = ''
}) => {
  const getColumnsClasses = () => {
    const columnClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      12: 'grid-cols-12'
    }
    return columnClasses[columns]
  }

  const getGapClasses = () => {
    const gaps = {
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8'
    }
    return gaps[gap]
  }

  return (
    <div className={`grid ${getColumnsClasses()} ${getGapClasses()} ${className}`}>
      {children}
    </div>
  )
}