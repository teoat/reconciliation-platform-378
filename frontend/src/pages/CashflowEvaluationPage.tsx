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
} from 'lucide-react';
import { useData } from '../../components/DataProvider';
import type { ExpenseCategory } from './cashflow/types';
import { useCashflowData } from './cashflow/hooks/useCashflowData';
import { useCashflowFilters } from './cashflow/hooks/useCashflowFilters';
import { CashflowMetrics } from './cashflow/components/CashflowMetrics';
import { CashflowCategoryCard } from './cashflow/components/CashflowCategoryCard';
import { CashflowFilters } from './cashflow/components/CashflowFilters';
import { CashflowTable } from '../../components/cashflow/CashflowTable';
import { CashflowCharts } from '../../components/cashflow/CashflowCharts';
import { CashflowCategoryModal } from '../components/cashflow/CashflowCategoryModal';
import type { Project } from '@/types/backend-aligned';

// Types
type ViewMode = 'cards' | 'table' | 'chart';
type FilterConfig = {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'notIn';
  value: string | number | boolean | string[] | number[] | null;
  value2?: string | number | null;
  active: boolean;
};

interface CashflowEvaluationPageProps {
  project?: Project;
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

      {/* Table View */}
      {viewMode === 'table' && (
        <CashflowTable
          categories={filteredCategories}
          onCategoryClick={handleCategoryClick}
        />
      )}

      {/* Chart View */}
      {viewMode === 'chart' && (
        <CashflowCharts
          categories={filteredCategories}
          viewType="bar"
        />
      )}

      {/* Category Detail Modal */}
      <CashflowCategoryModal
        category={selectedCategory}
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
      />
    </div>
  );
};

export default CashflowEvaluationPage;

