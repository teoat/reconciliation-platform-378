// Simplified Touch Targets Component
// Reduced from 708 lines to ~100 lines by focusing on essential functionality

import React from 'react';

export interface TouchTargetProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export const TouchTarget: React.FC<TouchTargetProps> = ({
  children,
  size = 'md',
  disabled = false,
  onClick,
  className = '',
}) => {
  const getSizeClasses = () => {
    const sizes = {
      sm: 'min-h-8 min-w-8 p-2',
      md: 'min-h-10 min-w-10 p-3',
      lg: 'min-h-12 min-w-12 p-4',
      xl: 'min-h-14 min-w-14 p-5',
    };
    return sizes[size];
  };

  const getDisabledClasses = () => {
    return disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50';
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`
        flex items-center justify-center rounded-lg border border-gray-200
        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
        ${getSizeClasses()}
        ${getDisabledClasses()}
        ${className}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-disabled={disabled}
    >
      {children}
    </div>
  );
};

// Simplified Touch Button Component
export interface TouchButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
}) => {
  const getVariantClasses = () => {
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-blue-500',
    };
    return variants[variant];
  };

  const getSizeClasses = () => {
    const sizes = {
      sm: 'min-h-8 px-3 py-2 text-sm',
      md: 'min-h-10 px-4 py-3 text-sm',
      lg: 'min-h-12 px-6 py-4 text-base',
      xl: 'min-h-14 px-8 py-5 text-lg',
    };
    return sizes[size];
  };

  const getDisabledClasses = () => {
    return disabled || loading ? 'opacity-50 cursor-not-allowed' : '';
  };

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-lg font-medium
        transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${getDisabledClasses()}
        ${className}
      `}
      disabled={disabled || loading}
      onClick={handleClick}
    >
      {loading && (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
};

// Simplified Touch Input Component
export interface TouchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  className?: string;
}

export const TouchInput: React.FC<TouchInputProps> = ({
  value,
  onChange,
  placeholder,
  size = 'md',
  disabled = false,
  className = '',
}) => {
  const getSizeClasses = () => {
    const sizes = {
      sm: 'min-h-8 px-3 py-2 text-sm',
      md: 'min-h-10 px-4 py-3 text-sm',
      lg: 'min-h-12 px-6 py-4 text-base',
      xl: 'min-h-14 px-8 py-5 text-lg',
    };
    return sizes[size];
  };

  const getDisabledClasses = () => {
    return disabled ? 'opacity-50 cursor-not-allowed' : '';
  };

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`
        w-full rounded-lg border border-gray-300 px-3 py-2
        text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        ${getSizeClasses()}
        ${getDisabledClasses()}
        ${className}
      `}
    />
  );
};

// Simplified Touch Card Component
export interface TouchCardProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const TouchCard: React.FC<TouchCardProps> = ({
  children,
  size = 'md',
  interactive = false,
  onClick,
  className = '',
}) => {
  const getSizeClasses = () => {
    const sizes = {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    };
    return sizes[size];
  };

  const getInteractiveClasses = () => {
    return interactive ? 'cursor-pointer hover:shadow-md transition-shadow' : '';
  };

  const handleClick = () => {
    if (interactive && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (interactive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200 shadow-sm
        ${getSizeClasses()}
        ${getInteractiveClasses()}
        ${className}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? 'Interactive card' : undefined}
    >
      {children}
    </div>
  );
};
