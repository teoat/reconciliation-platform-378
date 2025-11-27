/**
 * Cashflow Category Card Component
 * 
 * Displays a single expense category card
 */

import React from 'react';
import { Eye, Edit } from 'lucide-react';
import type { ExpenseCategory } from '../types';
import { formatCurrency, formatPercentage, getStatusIcon, getStatusColor, getCategoryColor } from '../utils/formatting';

interface CashflowCategoryCardProps {
  category: ExpenseCategory;
  onCategoryClick: (category: ExpenseCategory) => void;
}

export const CashflowCategoryCard: React.FC<CashflowCategoryCardProps> = ({
  category,
  onCategoryClick,
}) => {
  return (
    <div
      className="card cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onCategoryClick(category)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getCategoryColor(category.color)} text-white`}>
            {category.icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary-900">{category.name}</h3>
            <p className="text-sm text-secondary-600">{category.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(category.status)}
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(category.status)}`}
          >
            {category.status.charAt(0).toUpperCase() + category.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-secondary-600">Reported:</span>
          <span className="text-sm font-semibold text-secondary-900">
            {formatCurrency(category.totalReported)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-secondary-600">Cashflow:</span>
          <span className="text-sm font-semibold text-secondary-900">
            {formatCurrency(category.totalCashflow)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-secondary-600">Discrepancy:</span>
          <span
            className={`text-sm font-semibold ${
              category.discrepancy < 0 ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {formatCurrency(category.discrepancy)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-secondary-600">Percentage:</span>
          <span
            className={`text-sm font-semibold ${
              category.discrepancyPercentage < 0 ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {formatPercentage(category.discrepancyPercentage)}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-secondary-200">
        <div className="flex justify-between items-center text-sm text-secondary-500">
          <span>{category.transactionCount} transactions</span>
          <span>{category.subcategories.length} subcategories</span>
        </div>
      </div>
    </div>
  );
};

