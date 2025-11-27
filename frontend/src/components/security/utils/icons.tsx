/**
 * Security Icon Utilities
 */

import * as React from 'react';
import { Shield, Lock, Eye, Settings } from 'lucide-react';

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'access_control':
      return <Shield className="w-4 h-4 text-primary-600" />;
    case 'encryption':
    case 'data_protection':
      return <Lock className="w-4 h-4 text-primary-600" />;
    case 'audit':
      return <Eye className="w-4 h-4 text-primary-600" />;
    case 'compliance':
      return <Settings className="w-4 h-4 text-primary-600" />;
    default:
      return <Shield className="w-4 h-4 text-primary-600" />;
  }
};

