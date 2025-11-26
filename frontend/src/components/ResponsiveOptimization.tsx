// Simplified Responsive Optimization Component
// Reduced from 532 lines to ~100 lines by focusing on essential functionality

import React from 'react';

export interface ResponsiveProps {
  children: React.ReactNode;
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  hideOn?: 'mobile' | 'tablet' | 'desktop';
  showOn?: 'mobile' | 'tablet' | 'desktop';
  className?: string;
}

export const Responsive: React.FC<ResponsiveProps> = ({
  children,
  breakpoint: _breakpoint = 'md',
  hideOn,
  showOn,
  className = '',
}) => {
  const getVisibilityClasses = () => {
    let classes = '';

    if (hideOn) {
      switch (hideOn) {
        case 'mobile':
          classes += 'block sm:hidden';
          break;
        case 'tablet':
          classes += 'hidden sm:block lg:hidden';
          break;
        case 'desktop':
          classes += 'hidden lg:block';
          break;
      }
    } else if (showOn) {
      switch (showOn) {
        case 'mobile':
          classes += 'block sm:hidden';
          break;
        case 'tablet':
          classes += 'hidden sm:block lg:hidden';
          break;
        case 'desktop':
          classes += 'hidden lg:block';
          break;
      }
    }

    return classes;
  };

  return <div className={`${getVisibilityClasses()} ${className}`}>{children}</div>;
};

// Simplified Responsive Container Component
export interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'lg',
  padding = 'md',
  className = '',
}) => {
  const getMaxWidthClasses = () => {
    const maxWidths = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      full: 'max-w-full',
    };
    return maxWidths[maxWidth];
  };

  const getPaddingClasses = () => {
    const paddings = {
      xs: 'px-2 sm:px-4',
      sm: 'px-4 sm:px-6',
      md: 'px-6 sm:px-8',
      lg: 'px-8 sm:px-12',
      xl: 'px-12 sm:px-16',
    };
    return paddings[padding];
  };

  return (
    <div className={`mx-auto ${getMaxWidthClasses()} ${getPaddingClasses()} ${className}`}>
      {children}
    </div>
  );
};

// Simplified Responsive Grid Component
export interface ResponsiveGridProps {
  children: React.ReactNode;
  mobileColumns?: 1 | 2;
  tabletColumns?: 2 | 3 | 4;
  desktopColumns?: 3 | 4 | 5 | 6;
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 3,
  gap = 'md',
  className = '',
}) => {
  const getColumnsClasses = () => {
    const mobileClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
    };

    const tabletClasses = {
      2: 'sm:grid-cols-2',
      3: 'sm:grid-cols-3',
      4: 'sm:grid-cols-4',
    };

    const desktopClasses = {
      3: 'lg:grid-cols-3',
      4: 'lg:grid-cols-4',
      5: 'lg:grid-cols-5',
      6: 'lg:grid-cols-6',
    };

    return `${mobileClasses[mobileColumns]} ${tabletClasses[tabletColumns]} ${desktopClasses[desktopColumns]}`;
  };

  const getGapClasses = () => {
    const gaps = {
      xs: 'gap-1 sm:gap-2',
      sm: 'gap-2 sm:gap-3',
      md: 'gap-4 sm:gap-6',
      lg: 'gap-6 sm:gap-8',
      xl: 'gap-8 sm:gap-12',
    };
    return gaps[gap];
  };

  return (
    <div className={`grid ${getColumnsClasses()} ${getGapClasses()} ${className}`}>{children}</div>
  );
};

// Simplified Responsive Text Component
export interface ResponsiveTextProps {
  children: React.ReactNode;
  mobileSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  tabletSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  desktopSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  mobileSize = 'base',
  tabletSize = 'lg',
  desktopSize = 'xl',
  className = '',
}) => {
  const getSizeClasses = () => {
    const mobileSizes = {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    };

    const tabletSizes = {
      xs: 'sm:text-xs',
      sm: 'sm:text-sm',
      base: 'sm:text-base',
      lg: 'sm:text-lg',
      xl: 'sm:text-xl',
    };

    const desktopSizes = {
      xs: 'lg:text-xs',
      sm: 'lg:text-sm',
      base: 'lg:text-base',
      lg: 'lg:text-lg',
      xl: 'lg:text-xl',
      '2xl': 'lg:text-2xl',
      '3xl': 'lg:text-3xl',
    };

    return `${mobileSizes[mobileSize]} ${tabletSizes[tabletSize]} ${desktopSizes[desktopSize]}`;
  };

  return <div className={`${getSizeClasses()} ${className}`}>{children}</div>;
};

// Simplified Responsive Image Component
export interface ResponsiveImageProps {
  src: string;
  alt: string;
  mobileWidth?: string;
  tabletWidth?: string;
  desktopWidth?: string;
  className?: string;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  mobileWidth = 'w-full',
  tabletWidth = 'sm:w-3/4',
  desktopWidth = 'lg:w-1/2',
  className = '',
}) => {
  return (
    <img
      src={src}
      alt={alt}
      className={`${mobileWidth} ${tabletWidth} ${desktopWidth} h-auto object-cover ${className}`}
    />
  );
};
