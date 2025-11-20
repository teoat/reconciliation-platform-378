import React, { memo, useMemo } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = memo(
  ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className = '',
    disabled,
    ...props
  }) => {
    // Memoize class calculations to prevent recalculation on every render
    const classes = useMemo(() => {
      const baseClasses =
        'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

      const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
        outline:
          'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
      };

      const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
      };

      const widthClasses = fullWidth ? 'w-full' : '';

      return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClasses} ${className}`.trim();
    }, [variant, size, fullWidth, className]);

    // Memoize disabled state calculation
    const isDisabled = useMemo(() => disabled || loading, [disabled, loading]);

    // Generate aria-label if not provided
    const ariaLabel = useMemo(() => {
      if (props['aria-label']) return props['aria-label'];
      if (typeof children === 'string') return children;
      if (loading) return 'Loading...';
      return undefined;
    }, [props['aria-label'], children, loading]);

    // Generate aria-describedby if help text exists
    const ariaDescribedBy =
      props['aria-describedby'] ||
      (props['aria-label'] && `${props['aria-label']}-help`
        ? `${props['aria-label']}-help`
        : undefined);

    // Build ARIA props conditionally
    const ariaProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      ...(loading && { 'aria-busy': true }),
      ...props,
    };

    return (
      <button className={classes} disabled={isDisabled} {...ariaProps}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />}
        {!loading && leftIcon && (
          <span className="mr-2" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        {ariaLabel && typeof children !== 'string' && <span className="sr-only">{ariaLabel}</span>}
        {children}
        {!loading && rightIcon && (
          <span className="ml-2" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

export { Button };
export default Button;
