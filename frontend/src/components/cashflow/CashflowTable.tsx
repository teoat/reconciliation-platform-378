/**
 * CashflowTable Component
 * 
 * Displays cashflow data in a table format with sorting and filtering capabilities.
 * Shows category information including status, reported amounts, cashflow amounts, and discrepancies.
 * 
 * @param props - Component props
 * @param props.categories - Array of expense categories to display in the table
 * @param props.onCategoryClick - Callback function invoked when a category row is clicked
 * 
 * @returns JSX element representing the cashflow table
 * 
 * @example
 * ```tsx
 * <CashflowTable
 *   categories={expenseCategories}
 *   onCategoryClick={(category) => {
 *     // Handle category selection
 *   }}
 * />
 * ```
 */

import React from 'react';
import { logger } from '@/services/logger';
import type { ExpenseCategory } from '@/pages/cashflow/types';

interface CashflowTableProps {
  /** Array of expense categories to display in the table */
  categories: ExpenseCategory[];
  /** Callback function invoked when a category row is clicked */
  onCategoryClick: (category: ExpenseCategory) => void;
}

export const CashflowTable: React.FC<CashflowTableProps> = ({
  categories,
  onCategoryClick,
}) => {
  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-secondary-200">
              <th className="text-left py-3 px-4 font-medium text-secondary-700">Category</th>
              <th className="text-left py-3 px-4 font-medium text-secondary-700">Status</th>
              <th className="text-left py-3 px-4 font-medium text-secondary-700">Reported</th>
              <th className="text-left py-3 px-4 font-medium text-secondary-700">Cashflow</th>
              <th className="text-left py-3 px-4 font-medium text-secondary-700">Discrepancy</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(category => (
              <tr
                key={category.id}
                className="border-b border-secondary-100 hover:bg-secondary-50 cursor-pointer"
                onClick={() => onCategoryClick(category)}
              >
                <td className="py-4 px-4">
                  <div className="font-medium text-secondary-900">{category.name}</div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-secondary-600">{category.status}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm font-semibold text-secondary-900">
                    {category.totalReported.toLocaleString()}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm font-semibold text-secondary-900">
                    {category.totalCashflow.toLocaleString()}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span
                    className={`text-sm font-semibold ${
                      category.discrepancy < 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {category.discrepancy.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

