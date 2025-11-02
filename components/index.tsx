// ============================================================================
// CENTRALIZED COMPONENTS - SINGLE SOURCE OF TRUTH
// ============================================================================

import React, { useState, useEffect, useCallback, useRef, useMemo, FC } from 'react';
import {
  useLocalStorage,
  useSessionStorage,
  useToggle,
  useCounter,
  useArray,
  useObject,
  useDebounce,
  useThrottle,
  useInterval,
  useTimeout,
  usePrevious,
  useIsFirstRender,
  useIsMounted,
  useClickOutside,
  useFocus,
  useHover,
  useAsync,
  useFetch,
  useMutation,
  useForm,
  useWindowSize,
  useScrollPosition,
  useOnlineStatus,
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
} from '../hooks';

// ============================================================================
// UI COMPONENTS
// ============================================================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
    error: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed';
  const fullWidthClasses = 'w-full';

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled || loading ? disabledClasses : '',
    fullWidth ? fullWidthClasses : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
    </button>
  );
};

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'error' | 'success';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  leftIcon,
  rightIcon,
  variant = 'default',
  className = '',
  ...props
}) => {
  const baseClasses =
    'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    default: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
    error: 'border-red-300 focus:ring-red-500 focus:border-red-500',
    success: 'border-green-300 focus:ring-green-500 focus:border-green-500',
  };

  const fullWidthClasses = 'w-full';

  const classes = [
    baseClasses,
    variantClasses[variant],
    fullWidth ? fullWidthClasses : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input className={classes} {...props} />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
};

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  variant?: 'default' | 'error' | 'success';
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  variant = 'default',
  className = '',
  ...props
}) => {
  const baseClasses =
    'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    default: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
    error: 'border-red-300 focus:ring-red-500 focus:border-red-500',
    success: 'border-green-300 focus:ring-green-500 focus:border-green-500',
  };

  const fullWidthClasses = 'w-full';

  const classes = [
    baseClasses,
    variantClasses[variant],
    fullWidth ? fullWidthClasses : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <textarea className={classes} {...props} />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
};

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  variant?: 'default' | 'error' | 'success';
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  options,
  placeholder,
  variant = 'default',
  className = '',
  ...props
}) => {
  const baseClasses =
    'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    default: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
    error: 'border-red-300 focus:ring-red-500 focus:border-red-500',
    success: 'border-green-300 focus:ring-green-500 focus:border-green-500',
  };

  const fullWidthClasses = 'w-full';

  const classes = [
    baseClasses,
    variantClasses[variant],
    fullWidth ? fullWidthClasses : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select className={classes} {...props}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
};

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  variant?: 'default' | 'error' | 'success';
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  variant = 'default',
  className = '',
  ...props
}) => {
  const baseClasses = 'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded';

  const variantClasses = {
    default: 'border-gray-300 focus:ring-blue-500',
    error: 'border-red-300 focus:ring-red-500',
    success: 'border-green-300 focus:ring-green-500',
  };

  const fullWidthClasses = 'w-full';

  const classes = [
    baseClasses,
    variantClasses[variant],
    fullWidth ? fullWidthClasses : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      <div className="flex items-center">
        <input type="checkbox" className={classes} {...props} />
        {label && <label className="ml-2 block text-sm font-medium text-gray-700">{label}</label>}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
};

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options: { value: string; label: string; disabled?: boolean }[];
  variant?: 'default' | 'error' | 'success';
}

export const Radio: React.FC<RadioProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  options,
  variant = 'default',
  className = '',
  ...props
}) => {
  const baseClasses = 'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300';

  const variantClasses = {
    default: 'border-gray-300 focus:ring-blue-500',
    error: 'border-red-300 focus:ring-red-500',
    success: 'border-green-300 focus:ring-green-500',
  };

  const fullWidthClasses = 'w-full';

  const classes = [
    baseClasses,
    variantClasses[variant],
    fullWidth ? fullWidthClasses : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center">
            <input
              type="radio"
              className={classes}
              value={option.value}
              disabled={option.disabled}
              {...props}
            />
            <label className="ml-2 block text-sm font-medium text-gray-700">{option.label}</label>
          </div>
        ))}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
};

// ============================================================================
// LAYOUT COMPONENTS
// ============================================================================

export interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  maxWidth = 'xl',
  padding = 'md',
  className = '',
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-2',
    md: 'px-6 py-4',
    lg: 'px-8 py-6',
    xl: 'px-12 py-8',
  };

  const classes = ['mx-auto', maxWidthClasses[maxWidth], paddingClasses[padding], className]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}>{children}</div>;
};

export interface GridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Grid: React.FC<GridProps> = ({ children, cols = 1, gap = 'md', className = '' }) => {
  const colsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
  };

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const classes = ['grid', colsClasses[cols], gapClasses[gap], className].filter(Boolean).join(' ');

  return <div className={classes}>{children}</div>;
};

export interface FlexProps {
  children: React.ReactNode;
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Flex: React.FC<FlexProps> = ({
  children,
  direction = 'row',
  justify = 'start',
  align = 'start',
  wrap = 'nowrap',
  gap = 'none',
  className = '',
}) => {
  const directionClasses = {
    row: 'flex-row',
    column: 'flex-col',
    'row-reverse': 'flex-row-reverse',
    'column-reverse': 'flex-col-reverse',
  };

  const justifyClasses = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  const alignClasses = {
    start: 'items-start',
    end: 'items-end',
    center: 'items-center',
    baseline: 'items-baseline',
    stretch: 'items-stretch',
  };

  const wrapClasses = {
    nowrap: 'flex-nowrap',
    wrap: 'flex-wrap',
    'wrap-reverse': 'flex-wrap-reverse',
  };

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const classes = [
    'flex',
    directionClasses[direction],
    justifyClasses[justify],
    alignClasses[align],
    wrapClasses[wrap],
    gapClasses[gap],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}>{children}</div>;
};

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  actions,
  padding = 'md',
  shadow = 'md',
  className = '',
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12',
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };

  const classes = [
    'bg-white rounded-lg border border-gray-200',
    paddingClasses[padding],
    shadowClasses[shadow],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      {(title || subtitle || actions) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

// ============================================================================
// FEEDBACK COMPONENTS
// ============================================================================

export interface AlertProps {
  children: React.ReactNode;
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  type = 'info',
  title,
  dismissible = false,
  onDismiss,
  className = '',
}) => {
  const typeClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  const iconClasses = {
    info: 'text-blue-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
  };

  const icons = {
    info: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
    success: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  const classes = ['border rounded-md p-4', typeClasses[type], className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className="flex">
        <div className="flex-shrink-0">
          <span className={iconClasses[type]}>{icons[type]}</span>
        </div>
        <div className="ml-3 flex-1">
          {title && <h3 className="text-sm font-medium mb-1">{title}</h3>}
          <div className="text-sm">{children}</div>
        </div>
        {dismissible && onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
                onClick={onDismiss}
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({ size = 'md', text, className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const classes = [
    'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex items-center justify-center">
      <div className={classes} />
      {text && <span className="ml-2 text-sm text-gray-600">{text}</span>}
    </div>
  );
};

export interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'yellow' | 'red';
  showLabel?: boolean;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  color = 'blue',
  showLabel = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
  };

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
  };

  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const classes = ['w-full bg-gray-200 rounded-full overflow-hidden', sizeClasses[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
      <div className={classes}>
        <div
          className={`h-full transition-all duration-300 ease-in-out ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// ============================================================================
// DATA DISPLAY COMPONENTS
// ============================================================================

export interface TableProps {
  data: Record<string, unknown>[];
  columns: {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
  }[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export const Table: React.FC<TableProps> = ({
  data,
  columns,
  sortBy,
  sortDirection = 'asc',
  onSort,
  loading = false,
  emptyMessage = 'No data available',
  className = '',
}) => {
  const handleSort = (key: string) => {
    if (!onSort) return;

    const newDirection = sortBy === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(key, newDirection);
  };

  const classes = ['min-w-full divide-y divide-gray-200', className].filter(Boolean).join(' ');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loading text="Loading..." />
      </div>
    );
  }

  if (data.length === 0) {
    return <div className="text-center py-8 text-gray-500">{emptyMessage}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className={classes}>
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                }`}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label}</span>
                  {column.sortable && (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                      />
                    </svg>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showPrevNext = true,
  maxVisiblePages = 5,
  className = '',
}) => {
  const getVisiblePages = () => {
    const pages: number[] = [];
    const half = Math.floor(maxVisiblePages / 2);

    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  const classes = [
    'flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <div className="flex items-center">
        <p className="text-sm text-gray-700">
          Showing page <span className="font-medium">{currentPage}</span> of{' '}
          <span className="font-medium">{totalPages}</span>
        </p>
      </div>
      <div className="flex items-center space-x-2">
        {showFirstLast && currentPage > 1 && (
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            First
          </button>
        )}

        {showPrevNext && currentPage > 1 && (
          <button
            onClick={() => onPageChange(currentPage - 1)}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Previous
          </button>
        )}

        {visiblePages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              page === currentPage
                ? 'text-white bg-blue-600 border border-blue-600'
                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}

        {showPrevNext && currentPage < totalPages && (
          <button
            onClick={() => onPageChange(currentPage + 1)}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Next
          </button>
        )}

        {showFirstLast && currentPage < totalPages && (
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Last
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// EXPORT ALL COMPONENTS
// ============================================================================

// Export existing components
export { default as Navigation } from './Navigation';
export { default as FrenlyAI } from './FrenlyAI';
export { DataProvider } from './DataProvider';
export { FrenlyProvider } from './FrenlyProvider';
export * from './ProjectComponents';
export { default as AdvancedFilters } from './AdvancedFilters';
export { default as ReconciliationAnalytics } from './ReconciliationAnalytics';
export { default as DataAnalysis } from './DataAnalysis';
export { default as EnhancedIngestionPage } from './EnhancedIngestionPage';
export { default as SynchronizedReconciliationPage } from './SynchronizedReconciliationPage';
export { default as IntegrationSettings } from './IntegrationSettings';
export { default as MobileNavigation } from './MobileNavigation';

// Export context providers
export {
  AuthProvider,
  ProjectProvider,
  DataIngestionProvider,
  ReconciliationProvider,
  AdjudicationProvider,
  VisualizationProvider,
  IntegrationProvider,
} from '../contexts';

// ============================================================================
// LAZY-LOADED HEAVY COMPONENTS
// ============================================================================

import { withLazyLoading } from './LazyLoading';

// Lazy-loaded heavy components for better performance
export const LazyAdvancedVisualization = withLazyLoading(
  () => import('./AdvancedVisualization'),
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
  </div>
);

export const LazyReconciliationAnalytics = withLazyLoading(
  () => import('./ReconciliationAnalytics'),
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
  </div>
);

export const LazyAIDiscrepancyDetection = withLazyLoading(
  () => import('./AIDiscrepancyDetection'),
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
  </div>
);

// Export hooks, utils, and constants
export * from '../hooks';
export * from '../utils';
export * from '../constants';
