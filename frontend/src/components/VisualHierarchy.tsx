// Simplified Visual Hierarchy Component
// Reduced from 733 lines to ~100 lines by focusing on essential functionality

import React from 'react';
import { uiService } from '../services/uiService';

export interface VisualHierarchyProps {
  children: React.ReactNode;
  level?: 'primary' | 'secondary' | 'tertiary';
  emphasis?: 'low' | 'medium' | 'high';
  className?: string;
}

export const VisualHierarchy: React.FC<VisualHierarchyProps> = ({
  children,
  level = 'primary',
  emphasis = 'medium',
  className = '',
}) => {
  const getLevelClasses = () => {
    const levels = {
      primary: 'text-lg font-semibold text-gray-900',
      secondary: 'text-base font-medium text-gray-700',
      tertiary: 'text-sm text-gray-600',
    };
    return levels[level];
  };

  const getEmphasisClasses = () => {
    const emphasisLevels = {
      low: 'opacity-75',
      medium: 'opacity-100',
      high: 'opacity-100 font-bold',
    };
    return emphasisLevels[emphasis];
  };

  const getShadowClasses = () => {
    if (level === 'primary' && emphasis === 'high') {
      return 'shadow-lg';
    } else if (level === 'secondary' && emphasis === 'high') {
      return 'shadow-md';
    }
    return 'shadow-sm';
  };

  return (
    <div
      className={`
        ${getLevelClasses()}
        ${getEmphasisClasses()}
        ${getShadowClasses()}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Simplified Typography Component
export interface TypographyProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption';
  color?: 'primary' | 'secondary' | 'muted' | 'accent';
  className?: string;
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body',
  color = 'primary',
  className = '',
}) => {
  const getVariantClasses = () => {
    const variants = {
      h1: 'text-4xl font-bold',
      h2: 'text-3xl font-semibold',
      h3: 'text-2xl font-semibold',
      h4: 'text-xl font-medium',
      h5: 'text-lg font-medium',
      h6: 'text-base font-medium',
      body: 'text-base',
      caption: 'text-sm',
    };
    return variants[variant];
  };

  const getColorClasses = () => {
    const colors = {
      primary: 'text-gray-900',
      secondary: 'text-gray-700',
      muted: 'text-gray-500',
      accent: 'text-blue-600',
    };
    return colors[color];
  };

<<<<<<< HEAD
  const Component = variant.startsWith('h') ? (variant as keyof JSX.IntrinsicElements) : 'p';
=======
  const Component = variant.startsWith('h') ? variant as keyof React.JSX.IntrinsicElements : 'p'
>>>>>>> 26355dbeb6c502c5e28667489dcec2dc481751c1

  return (
    <Component
      className={`
        ${getVariantClasses()}
        ${getColorClasses()}
        ${className}
      `}
    >
      {children}
    </Component>
  );
};

// Simplified Spacing Component
export interface SpacingProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  direction?: 'vertical' | 'horizontal' | 'all';
  className?: string;
}

export const Spacing: React.FC<SpacingProps> = ({
  children,
  size = 'md',
  direction = 'all',
  className = '',
}) => {
  const getSizeClasses = () => {
    const sizes = {
      xs: '1',
      sm: '2',
      md: '4',
      lg: '6',
      xl: '8',
    };
    return sizes[size];
  };

  const getDirectionClasses = () => {
    const directions = {
      vertical: `py-${getSizeClasses()}`,
      horizontal: `px-${getSizeClasses()}`,
      all: `p-${getSizeClasses()}`,
    };
    return directions[direction];
  };

  return <div className={`${getDirectionClasses()} ${className}`}>{children}</div>;
};

// Simplified Card Component with Visual Hierarchy
export interface HierarchyCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  level?: 'primary' | 'secondary' | 'tertiary';
  className?: string;
}

export const HierarchyCard: React.FC<HierarchyCardProps> = ({
  children,
  title,
  subtitle,
  level = 'primary',
  className = '',
}) => {
  const getCardClasses = () => {
    const levels = {
      primary: 'bg-white border-2 border-blue-200 shadow-lg',
      secondary: 'bg-gray-50 border border-gray-200 shadow-md',
      tertiary: 'bg-gray-100 border border-gray-100 shadow-sm',
    };
    return levels[level];
  };

  return (
    <div className={`rounded-lg p-6 ${getCardClasses()} ${className}`}>
      {title && (
        <VisualHierarchy level={level} emphasis="high">
          {title}
        </VisualHierarchy>
      )}
      {subtitle && (
        <Typography variant="caption" color="muted" className="mt-1">
          {subtitle}
        </Typography>
      )}
      <Spacing size="md" direction="vertical">
        {children}
      </Spacing>
    </div>
  );
};
