import React from 'react'

// Responsive Grid System
interface GridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: 'sm' | 'md' | 'lg' | 'xl'
}

export const ResponsiveGrid: React.FC<GridProps> = ({ 
  children, 
  className = '',
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md'
}) => {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  }

  const colClasses = {
    default: cols.default ? `grid-cols-${cols.default}` : 'grid-cols-1',
    sm: cols.sm ? `sm:grid-cols-${cols.sm}` : '',
    md: cols.md ? `md:grid-cols-${cols.md}` : '',
    lg: cols.lg ? `lg:grid-cols-${cols.lg}` : '',
    xl: cols.xl ? `xl:grid-cols-${cols.xl}` : ''
  }

  const gridClasses = [
    'grid',
    colClasses.default,
    colClasses.sm,
    colClasses.md,
    colClasses.lg,
    colClasses.xl,
    gapClasses[gap],
    className
  ].filter(Boolean).join(' ')

  return <div className={gridClasses}>{children}</div>
}

// Responsive Container
interface ContainerProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: boolean
}

export const ResponsiveContainer: React.FC<ContainerProps> = ({
  children,
  className = '',
  size = 'lg',
  padding = true
}) => {
  const sizeClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    xl: 'max-w-8xl',
    full: 'max-w-full'
  }

  const paddingClasses = padding ? 'px-4 sm:px-6 lg:px-8' : ''

  return (
    <div className={`mx-auto ${sizeClasses[size]} ${paddingClasses} ${className}`}>
      {children}
    </div>
  )
}

// Responsive Card Grid
interface CardGridProps {
  children: React.ReactNode
  className?: string
  cardsPerRow?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
  }
}

export const CardGrid: React.FC<CardGridProps> = ({
  children,
  className = '',
  cardsPerRow = { default: 1, sm: 2, md: 3, lg: 4 }
}) => {
  return (
    <ResponsiveGrid
      cols={cardsPerRow}
      gap="lg"
      className={className}
    >
      {children}
    </ResponsiveGrid>
  )
}

// Responsive Flex Container
interface FlexContainerProps {
  children: React.ReactNode
  className?: string
  direction?: 'row' | 'col'
  wrap?: boolean
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  align?: 'start' | 'center' | 'end' | 'stretch'
  responsive?: {
    direction?: {
      default?: 'row' | 'col'
      sm?: 'row' | 'col'
      md?: 'row' | 'col'
      lg?: 'row' | 'col'
    }
  }
}

export const ResponsiveFlex: React.FC<FlexContainerProps> = ({
  children,
  className = '',
  direction = 'row',
  wrap = false,
  justify = 'start',
  align = 'start',
  responsive = {}
}) => {
  const directionClasses = {
    row: 'flex-row',
    col: 'flex-col'
  }

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around'
  }

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  }

  const responsiveClasses = responsive.direction ? [
    responsive.direction.default ? directionClasses[responsive.direction.default] : '',
    responsive.direction.sm ? `sm:${directionClasses[responsive.direction.sm]}` : '',
    responsive.direction.md ? `md:${directionClasses[responsive.direction.md]}` : '',
    responsive.direction.lg ? `lg:${directionClasses[responsive.direction.lg]}` : ''
  ].filter(Boolean).join(' ') : directionClasses[direction]

  const flexClasses = [
    'flex',
    responsiveClasses,
    wrap ? 'flex-wrap' : '',
    justifyClasses[justify],
    alignClasses[align],
    className
  ].filter(Boolean).join(' ')

  return <div className={flexClasses}>{children}</div>
}

// Responsive Text
interface ResponsiveTextProps {
  children: React.ReactNode
  className?: string
  size?: {
    default?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
    sm?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
    md?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
    lg?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  }
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  color?: 'primary' | 'secondary' | 'muted' | 'success' | 'warning' | 'error'
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  className = '',
  size = { default: 'base' },
  weight = 'normal',
  color = 'primary'
}) => {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl'
  }

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  }

  const colorClasses = {
    primary: 'text-gray-900',
    secondary: 'text-gray-600',
    muted: 'text-gray-500',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  }

  const responsiveSizeClasses = [
    size.default ? sizeClasses[size.default] : '',
    size.sm ? `sm:${sizeClasses[size.sm]}` : '',
    size.md ? `md:${sizeClasses[size.md]}` : '',
    size.lg ? `lg:${sizeClasses[size.lg]}` : ''
  ].filter(Boolean).join(' ')

  const textClasses = [
    responsiveSizeClasses,
    weightClasses[weight],
    colorClasses[color],
    className
  ].filter(Boolean).join(' ')

  return <span className={textClasses}>{children}</span>
}

// Responsive Spacing
interface SpacingProps {
  children: React.ReactNode
  className?: string
  padding?: {
    default?: 'sm' | 'md' | 'lg' | 'xl'
    sm?: 'sm' | 'md' | 'lg' | 'xl'
    md?: 'sm' | 'md' | 'lg' | 'xl'
    lg?: 'sm' | 'md' | 'lg' | 'xl'
  }
  margin?: {
    default?: 'sm' | 'md' | 'lg' | 'xl'
    sm?: 'sm' | 'md' | 'lg' | 'xl'
    md?: 'sm' | 'md' | 'lg' | 'xl'
    lg?: 'sm' | 'md' | 'lg' | 'xl'
  }
}

export const ResponsiveSpacing: React.FC<SpacingProps> = ({
  children,
  className = '',
  padding,
  margin
}) => {
  const spacingClasses = {
    sm: { p: 'p-2', m: 'm-2' },
    md: { p: 'p-4', m: 'm-4' },
    lg: { p: 'p-6', m: 'm-6' },
    xl: { p: 'p-8', m: 'm-8' }
  }

  const paddingClasses = padding ? [
    padding.default ? spacingClasses[padding.default].p : '',
    padding.sm ? `sm:${spacingClasses[padding.sm].p}` : '',
    padding.md ? `md:${spacingClasses[padding.md].p}` : '',
    padding.lg ? `lg:${spacingClasses[padding.lg].p}` : ''
  ].filter(Boolean).join(' ') : ''

  const marginClasses = margin ? [
    margin.default ? spacingClasses[margin.default].m : '',
    margin.sm ? `sm:${spacingClasses[margin.sm].m}` : '',
    margin.md ? `md:${spacingClasses[margin.md].m}` : '',
    margin.lg ? `lg:${spacingClasses[margin.lg].m}` : ''
  ].filter(Boolean).join(' ') : ''

  const spacingClassesCombined = [paddingClasses, marginClasses, className]
    .filter(Boolean)
    .join(' ')

  return <div className={spacingClassesCombined}>{children}</div>
}

// Responsive Visibility
interface ResponsiveVisibilityProps {
  children: React.ReactNode
  className?: string
  hide?: {
    default?: boolean
    sm?: boolean
    md?: boolean
    lg?: boolean
    xl?: boolean
  }
  show?: {
    default?: boolean
    sm?: boolean
    md?: boolean
    lg?: boolean
    xl?: boolean
  }
}

export const ResponsiveVisibility: React.FC<ResponsiveVisibilityProps> = ({
  children,
  className = '',
  hide,
  show
}) => {
  const hideClasses = hide ? [
    hide.default ? 'hidden' : '',
    hide.sm ? 'sm:hidden' : '',
    hide.md ? 'md:hidden' : '',
    hide.lg ? 'lg:hidden' : '',
    hide.xl ? 'xl:hidden' : ''
  ].filter(Boolean).join(' ') : ''

  const showClasses = show ? [
    show.default ? 'block' : '',
    show.sm ? 'sm:block' : '',
    show.md ? 'md:block' : '',
    show.lg ? 'lg:block' : '',
    show.xl ? 'xl:block' : ''
  ].filter(Boolean).join(' ') : ''

  const visibilityClasses = [hideClasses, showClasses, className]
    .filter(Boolean)
    .join(' ')

  return <div className={visibilityClasses}>{children}</div>
}

// Export all components
export {
  ResponsiveGrid as Grid,
  ResponsiveContainer as Container,
  ResponsiveFlex as Flex,
  ResponsiveText as Text,
  ResponsiveSpacing as Spacing,
  ResponsiveVisibility as Visibility
}
