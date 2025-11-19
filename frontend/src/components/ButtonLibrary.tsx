// Standardized Button Component Library
// Comprehensive button component library with consistent sizing, styling, and behavior

import React from 'react'

export interface ButtonVariant {
  primary: string
  secondary: string
  tertiary: string
  danger: string
  success: string
  warning: string
  info: string
  ghost: string
  outline: string
  link: string
}

export interface ButtonSize {
  xs: string
  sm: string
  md: string
  lg: string
  xl: string
}

export interface ButtonState {
  default: string
  hover: string
  active: string
  focus: string
  disabled: string
  loading: string
}

export interface ButtonConfig {
  variants: ButtonVariant
  sizes: ButtonSize
  states: ButtonState
  borderRadius: string
  fontFamily: string
  fontWeight: string
  transitionDuration: string
  focusRingWidth: string
  focusRingColor: string
  minTouchTarget: string
  iconSpacing: string
  loadingSpinnerSize: string
}

export interface ButtonProps {
  children: React.ReactNode
  variant?: keyof ButtonVariant
  size?: keyof ButtonSize
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void
  onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void
  className?: string
  id?: string
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  'aria-pressed'?: boolean
  'aria-haspopup'?: boolean
  type?: 'button' | 'submit' | 'reset'
  form?: string
  name?: string
  value?: string
  autoFocus?: boolean
  tabIndex?: number
  role?: string
  'data-testid'?: string
}

export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'icon' | 'iconPosition'> {
  icon: React.ReactNode
  'aria-label': string
}

export interface ButtonGroupProps {
  children: React.ReactNode
  orientation?: 'horizontal' | 'vertical'
  spacing?: 'tight' | 'normal' | 'loose'
  className?: string
  'data-testid'?: string
}

export interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: string
  className?: string
}

const defaultConfig: ButtonConfig = {
  variants: {
    primary: 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 border-gray-200 hover:bg-gray-300 focus:ring-gray-500',
    tertiary: 'bg-transparent text-gray-700 border-transparent hover:bg-gray-100 focus:ring-gray-500',
    danger: 'bg-red-600 text-white border-red-600 hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white border-green-600 hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-yellow-600 text-white border-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    info: 'bg-cyan-600 text-white border-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500',
    ghost: 'bg-transparent text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
    outline: 'bg-transparent text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
    link: 'bg-transparent text-blue-600 border-transparent hover:text-blue-800 hover:underline focus:ring-blue-500'
  },
  sizes: {
    xs: 'px-2 py-1 text-xs min-h-[24px]',
    sm: 'px-3 py-1.5 text-sm min-h-[32px]',
    md: 'px-4 py-2 text-sm min-h-[40px]',
    lg: 'px-6 py-3 text-base min-h-[48px]',
    xl: 'px-8 py-4 text-lg min-h-[56px]'
  },
  states: {
    default: '',
    hover: 'hover:shadow-md',
    active: 'active:scale-95',
    focus: 'focus:outline-none focus:ring-2 focus:ring-offset-2',
    disabled: 'opacity-50 cursor-not-allowed',
    loading: 'cursor-wait'
  },
  borderRadius: 'rounded-md',
  fontFamily: 'font-medium',
  fontWeight: 'font-medium',
  transitionDuration: 'transition-all duration-200',
  focusRingWidth: 'focus:ring-2',
  focusRingColor: 'focus:ring-offset-2',
  minTouchTarget: 'min-h-[44px]',
  iconSpacing: 'gap-2',
  loadingSpinnerSize: 'w-4 h-4'
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  onClick,
  onFocus,
  onBlur,
  onKeyDown,
  className = '',
  id,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-expanded': ariaExpanded,
  'aria-pressed': ariaPressed,
  'aria-haspopup': ariaHasPopup,
  type = 'button',
  form,
  name,
  value,
  autoFocus = false,
  tabIndex,
  role,
  'data-testid': dataTestId,
  ...props
}) => {
  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'border',
    'font-medium',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'active:scale-95',
    defaultConfig.borderRadius
  ]

  const variantClasses = defaultConfig.variants[variant].split(' ')
  const sizeClasses = defaultConfig.sizes[size].split(' ')
  
  const fullWidthClasses = fullWidth ? ['w-full'] : []
  const loadingClasses = loading ? ['cursor-wait'] : []
  const iconClasses = icon ? [defaultConfig.iconSpacing] : []

  const allClasses = [
    ...baseClasses,
    ...variantClasses,
    ...sizeClasses,
    ...fullWidthClasses,
    ...loadingClasses,
    ...iconClasses,
    className
  ].join(' ')

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      return
    }
    onKeyDown?.(event)
  }

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <LoadingSpinner size={size} />
          {children}
        </>
      )
    }

    if (icon) {
      return iconPosition === 'left' ? (
        <>
          {icon}
          {children}
        </>
      ) : (
        <>
          {children}
          {icon}
        </>
      )
    }

    return children
  }

  return (
    <button
      type={type}
      id={id}
      className={allClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={handleKeyDown}
      {...(ariaLabel && { 'aria-label': ariaLabel })}
      {...(ariaDescribedBy && { 'aria-describedby': ariaDescribedBy })}
      {...(ariaExpanded !== undefined && { 'aria-expanded': ariaExpanded })}
      {...(ariaPressed !== undefined && { 'aria-pressed': ariaPressed })}
      {...(ariaHasPopup !== undefined && { 'aria-haspopup': ariaHasPopup })}
      form={form}
      name={name}
      value={value}
      // autoFocus removed for accessibility - use programmatic focus if needed
      tabIndex={tabIndex}
      {...(role && { role })}
      data-testid={dataTestId}
      {...props}
    >
      {renderContent()}
    </button>
  )
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'tertiary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  'aria-label': ariaLabel,
  ...props
}) => {
  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'border',
    'font-medium',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'active:scale-95',
    defaultConfig.borderRadius
  ]

  const variantClasses = defaultConfig.variants[variant].split(' ')
  
  // Icon button specific sizing
  const iconSizeClasses = {
    xs: 'w-6 h-6 p-1',
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-3',
    xl: 'w-14 h-14 p-4'
  }

  const sizeClasses = iconSizeClasses[size].split(' ')
  const loadingClasses = loading ? ['cursor-wait'] : []

  const allClasses = [
    ...baseClasses,
    ...variantClasses,
    ...sizeClasses,
    ...loadingClasses,
    className
  ].join(' ')

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  return (
    <button
      className={allClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-label={ariaLabel}
      {...props}
    >
      {loading ? <LoadingSpinner size={size} /> : icon}
    </button>
  )
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  orientation = 'horizontal',
  spacing = 'normal',
  className = '',
  'data-testid': dataTestId,
  ...props
}) => {
  const baseClasses = ['inline-flex']
  
  const orientationClasses = orientation === 'horizontal' 
    ? ['flex-row'] 
    : ['flex-col']
  
  const spacingClasses = {
    tight: orientation === 'horizontal' ? ['space-x-1'] : ['space-y-1'],
    normal: orientation === 'horizontal' ? ['space-x-2'] : ['space-y-2'],
    loose: orientation === 'horizontal' ? ['space-x-4'] : ['space-y-4']
  }

  const allClasses = [
    ...baseClasses,
    ...orientationClasses,
    ...spacingClasses[spacing],
    className
  ].join(' ')

  return (
    <div
      className={allClasses}
      data-testid={dataTestId}
      role="group"
      {...props}
    >
      {children}
    </div>
  )
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'currentColor',
  className = ''
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  }

  const allClasses = [
    'animate-spin',
    'rounded-full',
    'border-2',
    'border-current',
    'border-t-transparent',
    sizeClasses[size],
    className
  ].join(' ')

  return (
    <div
      className={allClasses}
      style={{ borderColor: color }}
      role="status"
      aria-label="Loading"
    />
  )
}

// Specialized button variants
export const PrimaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="primary" {...props} />
)

export const SecondaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="secondary" {...props} />
)

export const DangerButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="danger" {...props} />
)

export const SuccessButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="success" {...props} />
)

export const WarningButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="warning" {...props} />
)

export const InfoButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="info" {...props} />
)

export const GhostButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="ghost" {...props} />
)

export const OutlineButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="outline" {...props} />
)

export const LinkButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="link" {...props} />
)

// Size-specific buttons
export const SmallButton: React.FC<Omit<ButtonProps, 'size'>> = (props) => (
  <Button size="sm" {...props} />
)

export const LargeButton: React.FC<Omit<ButtonProps, 'size'>> = (props) => (
  <Button size="lg" {...props} />
)

export const ExtraLargeButton: React.FC<Omit<ButtonProps, 'size'>> = (props) => (
  <Button size="xl" {...props} />
)

// Utility functions
export const getButtonClasses = (
  variant: keyof ButtonVariant = 'primary',
  size: keyof ButtonSize = 'md',
  fullWidth: boolean = false,
  disabled: boolean = false,
  loading: boolean = false,
  className: string = ''
): string => {
  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'border',
    'font-medium',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'active:scale-95',
    defaultConfig.borderRadius
  ]

  const variantClasses = defaultConfig.variants[variant].split(' ')
  const sizeClasses = defaultConfig.sizes[size].split(' ')
  
  const fullWidthClasses = fullWidth ? ['w-full'] : []
  const loadingClasses = loading ? ['cursor-wait'] : []

  return [
    ...baseClasses,
    ...variantClasses,
    ...sizeClasses,
    ...fullWidthClasses,
    ...loadingClasses,
    className
  ].join(' ')
}

export const validateButtonProps = (props: ButtonProps): string[] => {
  const errors: string[] = []

  if (props.loading && props.disabled) {
    errors.push('Button cannot be both loading and disabled')
  }

  if (props.icon && props.iconPosition === 'right' && !props.children) {
    errors.push('Icon button with right icon position requires children')
  }

  if (props.variant === 'link' && props.fullWidth) {
    errors.push('Link variant buttons should not be full width')
  }

  return errors
}

// Export all components and utilities
export default {
  Button,
  IconButton,
  ButtonGroup,
  LoadingSpinner,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  SuccessButton,
  WarningButton,
  InfoButton,
  GhostButton,
  OutlineButton,
  LinkButton,
  SmallButton,
  LargeButton,
  ExtraLargeButton,
  getButtonClasses,
  validateButtonProps,
  defaultConfig
}