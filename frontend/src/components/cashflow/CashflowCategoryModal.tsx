/**
 * CashflowCategoryModal Component
 * 
 * Displays detailed information about a selected expense category in a modal dialog.
 * Shows comprehensive category details including status, subcategories, transactions, and financial metrics.
 * 
 * @param props - Component props
 * @param props.category - The expense category to display. If null, modal will not render
 * @param props.isOpen - Whether the modal is currently open
 * @param props.onClose - Callback function invoked when the modal should be closed
 * 
 * @returns JSX element representing the modal dialog, or null if not open or category is null
 * 
 * @example
 * ```tsx
 * <CashflowCategoryModal
 *   category={selectedCategory}
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 * />
 * ```
 */

import React from 'react';
import { X } from 'lucide-react';
import type { ExpenseCategory } from '../../pages/cashflow/types';

interface CashflowCategoryModalProps {
  /** The expense category to display. If null, modal will not render */
  category: ExpenseCategory | null;
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Callback function invoked when the modal should be closed */
  onClose: () => void;
}

export const CashflowCategoryModal: React.FC<CashflowCategoryModalProps> = ({
  category,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !category) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-secondary-900">
            {category.name} - Detailed Analysis
          </h3>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600 transition-colors"
            title="Close modal"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-secondary-500 mb-1">Status</p>
              <p className="text-lg font-medium text-secondary-900">{category.status}</p>
            </div>
            <div>
              <p className="text-sm text-secondary-500 mb-1">Subcategories</p>
              <p className="text-lg font-medium text-secondary-900">
                {category.subcategories.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-secondary-500 mb-1">Transactions</p>
              <p className="text-lg font-medium text-secondary-900">
                {category.transactionCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-secondary-500 mb-1">Total Reported</p>
              <p className="text-lg font-medium text-secondary-900">
                {category.totalReported.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-secondary-500 mb-1">Total Cashflow</p>
              <p className="text-lg font-medium text-secondary-900">
                {category.totalCashflow.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-secondary-500 mb-1">Discrepancy</p>
              <p className={`text-lg font-medium ${
                category.discrepancy < 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {category.discrepancy.toLocaleString()}
              </p>
            </div>
          </div>

          {category.subcategories.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-secondary-900 mb-3">Subcategories</h4>
              <div className="space-y-2">
                {category.subcategories.map((subcategory, index) => (
                  <div
                    key={index}
                    className="p-3 bg-secondary-50 rounded border border-secondary-200"
                  >
                    <p className="font-medium text-secondary-900">{subcategory.name}</p>
                    <p className="text-sm text-secondary-600">
                      Reported: {subcategory.reportedAmount.toLocaleString()} | 
                      Cashflow: {subcategory.cashflowAmount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

