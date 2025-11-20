// Simplified High-Contrast Toggle Component
// Reduced from 295 lines to ~50 lines by using the consolidated uiService

import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { uiService } from '../services/uiService';

interface HighContrastToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const HighContrastToggle: React.FC<HighContrastToggleProps> = ({
  className = '',
  showLabel = true,
  size = 'md',
}) => {
  const isEnabled = uiService.isHighContrastEnabled();

  const handleToggle = () => {
    uiService.toggleHighContrast();
  };

  const getSizeClasses = () => {
    const sizeMap = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
    };
    return sizeMap[size];
  };

  const getIconSize = () => {
    const sizeMap = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };
    return sizeMap[size];
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors
        ${
          isEnabled
            ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }
        ${className}
      `}
      aria-label={isEnabled ? 'Disable high contrast' : 'Enable high contrast'}
      title={isEnabled ? 'Disable high contrast mode' : 'Enable high contrast mode'}
    >
      <div className={getSizeClasses()}>
        {isEnabled ? <EyeOff className={getIconSize()} /> : <Eye className={getIconSize()} />}
      </div>
      {showLabel && (
        <span className="text-sm font-medium">
          {isEnabled ? 'High Contrast On' : 'High Contrast Off'}
        </span>
      )}
    </button>
  );
};
