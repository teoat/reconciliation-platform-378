/**
 * Cashflow Formatting Utilities
 * 
 * Utility functions for formatting currency, percentages, and status
 */

import { CheckCircle, AlertTriangle, XCircle, TrendingUp } from 'lucide-react';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatPercentage = (percentage: number): string => {
  return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'balanced':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'discrepancy':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'missing':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'excess':
      return <TrendingUp className="w-5 h-5 text-blue-500" />;
    default:
      return null;
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'balanced':
      return 'bg-green-100 text-green-800';
    case 'discrepancy':
      return 'bg-yellow-100 text-yellow-800';
    case 'missing':
      return 'bg-red-100 text-red-800';
    case 'excess':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getCategoryColor = (color: string): string => {
  switch (color) {
    case 'blue':
      return 'bg-blue-500';
    case 'green':
      return 'bg-green-500';
    case 'purple':
      return 'bg-purple-500';
    case 'orange':
      return 'bg-orange-500';
    case 'red':
      return 'bg-red-500';
    case 'yellow':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

