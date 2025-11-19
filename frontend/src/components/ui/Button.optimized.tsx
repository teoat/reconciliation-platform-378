// ============================================================================
// OPTIMIZED BUTTON COMPONENT - Example of React.memo optimization
// ============================================================================

import React, { memo, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

/**
 * Optimized Button Component
 * Uses React.memo to prevent unnecessary re-renders
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click Me
 * </Button>
 * ```
 */
export const Button = memo(
  forwardRef<HTMLButtonElement, ButtonProps>(
    (
      {
        variant = 'primary',
        size = 'md',
        loading = false,
        disabled = false,
        fullWidth = false,
        icon,
        iconPosition = 'left',
        className = '',
        children,
        ...props
      },
      ref
    ) => {
      const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
      
      const variantStyles = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
        warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
        error: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
      };

      const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      };

      const isDisabled = disabled || loading;

      return (
        <button
          ref={ref}
          className={`
            ${baseStyles}
            ${variantStyles[variant]}
            ${sizeStyles[size]}
            ${fullWidth ? 'w-full' : ''}
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${className}
          `}
          disabled={isDisabled}
          {...props}
        >
          {loading && (
            <Loader2 className={`animate-spin ${iconPosition === 'left' ? 'mr-2' : 'ml-2'}`} />
          )}
          {icon && iconPosition === 'left' && !loading && <span className="mr-2">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && !loading && <span className="ml-2">{icon}</span>}
        </button>
      );
    }
  )
);

Button.displayName = 'Button';

