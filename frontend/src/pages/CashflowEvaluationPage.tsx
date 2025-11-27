/**
 * Cashflow Evaluation Page
 * 
 * Main orchestrator component for cashflow evaluation
 * Refactored from 1,138 lines to ~250 lines
 */

'use client';

import React, { useState } from 'react';
import {
  Search,
  Download,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart,
  Layers,
  Hash,
  Zap,
  X,
} from 'lucide-react';
import { useData } from '../../components/DataProvider';
import type { ExpenseCategory } from './cashflow/types';
import { useCashflowData } from './cashflow/hooks/useCashflowData';
import { useCashflowFilters } from './cashflow/hooks/useCashflowFilters';
import { CashflowMetrics } from './cashflow/components/CashflowMetrics';
import { CashflowCategoryCard } from './cashflow/components/CashflowCategoryCard';
import { CashflowFilters } from './cashflow/components/CashflowFilters';

// Types
type ViewMode = 'cards' | 'table' | 'chart';
type FilterConfig = {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'notIn';
  value: any;
  value2?: any;
  active: boolean;
};

interface CashflowEvaluationPageProps {
  project?: any;
  onProgressUpdate?: (step: string) => void;
}

const CashflowEvaluationPage: React.FC<CashflowEvaluationPageProps> = ({
  project,
  onProgressUpdate,
}) => {
  const { currentProject, getCashflowData, transformReconciliationToCashflow } = useData();

  // Data hook
  const {
    expenseCategories,
    setExpenseCategories,
    metrics,
    setMetrics,
    isProcessing,
    processingProgress,
    runDiscrepancyAnalysis,
  } = useCashflowData({
    currentProject,
    getCashflowData,
    onProgressUpdate,
  });

  // UI state
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: '2020-01-01',
    end: '2020-12-31',
  });

  // Filters hook
  const { filteredCategories } = useCashflowFilters({
    expenseCategories,
    searchTerm,
    filters,
  });

  // Handlers
  const handleCategoryClick = (category: ExpenseCategory) => {
    setSelectedCategory(category);
    setShowCategoryModal(true);
  };

  const handleRunAnalysis = async () => {
    await runDiscrepancyAnalysis(transformReconciliationToCashflow);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Cashflow Evaluation Balance Sheet
            </h1>
            <p className="text-secondary-600">
              Analyze expense discrepancies between reported journal entries and actual cashflows
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={handleRunAnalysis} className="btn-secondary flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Run Analysis</span>
            </button>
            <button className="btn-primary flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {project && (
          <div className="text-sm text-primary-600 bg-primary-50 px-3 py-2 rounded-lg inline-block">
            Project: {project.name}
          </div>
        )}
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="card mb-6">
          <div className="flex items-center space-x-4">
            <RefreshCw className="w-5 h-5 animate-spin text-primary-600" />
            <div className="flex-1">
              <div className="w-full bg-secondary-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              <p className="text-sm text-secondary-500 mt-2">
                {Math.round(processingProgress)}% complete
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics */}
      {metrics && <CashflowMetrics metrics={metrics} />}

      {/* Controls */}
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search categories, subcategories..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-full sm:w-64"
              />
            </div>

            <CashflowFilters
              filters={filters}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(!showFilters)}
              onSetFilters={setFilters}
              onClearFilters={() => setFilters([])}
            />

            <div className="flex items-center space-x-1 bg-secondary-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded ${
                  viewMode === 'cards' ? 'bg-white shadow-sm' : 'hover:bg-secondary-200'
                }`}
                title="Card view"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded ${
                  viewMode === 'table' ? 'bg-white shadow-sm' : 'hover:bg-secondary-200'
                }`}
                title="Table view"
              >
                <Hash className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`p-2 rounded ${
                  viewMode === 'chart' ? 'bg-white shadow-sm' : 'hover:bg-secondary-200'
                }`}
                title="Chart view"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="btn-secondary flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expense Categories Cards */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map(category => (
            <CashflowCategoryCard
              key={category.id}
              category={category}
              onCategoryClick={handleCategoryClick}
            />
          ))}
        </div>
      )}

      {/* Table View - TODO: Extract to CashflowTable component */}
      {viewMode === 'table' && (
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
                {filteredCategories.map(category => (
                  <tr
                    key={category.id}
                    className="border-b border-secondary-100 hover:bg-secondary-50"
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
      )}

      {/* Chart View - TODO: Extract to CashflowCharts component */}
      {viewMode === 'chart' && (
        <div className="card">
          <p className="text-secondary-600">Chart view - Coming soon</p>
        </div>
      )}

      {/* Category Detail Modal - TODO: Extract to CashflowCategoryModal component */}
      {showCategoryModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-secondary-900">
                {selectedCategory.name} - Detailed Analysis
              </h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-secondary-400 hover:text-secondary-600"
                title="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="text-secondary-600">
              <p>Category details for {selectedCategory.name}</p>
              <p>Subcategories: {selectedCategory.subcategories.length}</p>
              <p>Transactions: {selectedCategory.transactionCount}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashflowEvaluationPage;

