import React, { memo, useMemo } from 'react';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = memo(
  ({
    children,
    title,
    subtitle,
    actions,
    className = '',
    padding = 'md',
    shadow = 'sm',
    border = true,
    onClick,
  }) => {
    // Memoize padding classes
    const paddingClasses = useMemo(
      () => ({
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      }),
      []
    );

    // Memoize shadow classes
    const shadowClasses = useMemo(
      () => ({
        none: '',
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
      }),
      []
    );

    // Memoize class calculations
    const classes = useMemo(() => {
      const borderClasses = border ? 'border border-gray-200' : '';
      return `bg-white rounded-lg ${paddingClasses[padding]} ${shadowClasses[shadow]} ${borderClasses} ${className}`.trim();
    }, [padding, shadow, border, className, paddingClasses, shadowClasses]);

    // Memoize header visibility
    const showHeader = useMemo(() => !!(title || subtitle || actions), [title, subtitle, actions]);

    return (
      <div
        className={classes}
        onClick={onClick}
        onKeyDown={onClick ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        } : undefined}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        style={onClick ? { cursor: 'pointer' } : undefined}
        aria-label={onClick ? title || 'Clickable card' : undefined}
      >
        {showHeader && (
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
                {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
              </div>
              {actions && <div className="flex items-center space-x-2">{actions}</div>}
            </div>
          </div>
        )}

        <div className="text-gray-700">{children}</div>
      </div>
    );
  }
);

Card.displayName = 'Card';

export { Card };
export default Card;
