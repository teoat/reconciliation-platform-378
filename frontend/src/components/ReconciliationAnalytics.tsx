'use client';

<<<<<<< HEAD
import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { Activity } from 'lucide-react';
import { Target } from 'lucide-react';
import { Clock } from 'lucide-react';
import { Shield } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import { Download } from 'lucide-react';
import { X } from 'lucide-react';
=======
import { useState, useEffect } from 'react'
import { TrendingUp } from 'lucide-react'
import { BarChart3 } from 'lucide-react'
import { Activity } from 'lucide-react'
import { Target } from 'lucide-react'
import { Clock } from 'lucide-react'
import { Shield } from 'lucide-react'
import { CheckCircle } from 'lucide-react'
import { Download } from 'lucide-react'
import { X } from 'lucide-react'
import { Database } from 'lucide-react'
>>>>>>> 26355dbeb6c502c5e28667489dcec2dc481751c1

interface ReconciliationMetrics {
  totalRecords: number;
  matchedRecords: number;
  unmatchedRecords: number;
  discrepancyRecords: number;
  pendingRecords: number;
  resolvedRecords: number;
  escalatedRecords: number;
  averageConfidence: number;
  averageProcessingTime: number;
  matchRate: number;
  accuracy: number;
  throughput: number;
  errorRate: number;
  slaCompliance: number;
}

interface TrendData {
  date: string;
  total: number;
  matched: number;
  unmatched: number;
  discrepancy: number;
  processingTime: number;
  confidence: number;
}

interface SystemPerformance {
  systemId: string;
  systemName: string;
  recordCount: number;
  matchRate: number;
  averageConfidence: number;
  processingTime: number;
  errorRate: number;
  lastSync: string;
}

interface ReconciliationAnalyticsProps {
  metrics: ReconciliationMetrics;
  trendData: TrendData[];
  systemPerformance: SystemPerformance[];
  isVisible: boolean;
  onClose: () => void;
}

const ReconciliationAnalytics: React.FC<ReconciliationAnalyticsProps> = ({
  metrics,
  trendData,
  systemPerformance,
  isVisible,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'systems' | 'performance'>(
    'overview'
  );
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Generate sample trend data
  const generateTrendData = (days: number): TrendData[] => {
    const data: TrendData[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      data.push({
        date: date.toISOString().split('T')[0],
        total: Math.floor(Math.random() * 1000) + 500,
        matched: Math.floor(Math.random() * 800) + 400,
        unmatched: Math.floor(Math.random() * 100) + 50,
        discrepancy: Math.floor(Math.random() * 50) + 25,
        processingTime: Math.random() * 5 + 1,
        confidence: Math.random() * 20 + 80,
      });
    }

    return data;
  };

  const currentTrendData = generateTrendData(
    timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'matched':
        return 'text-green-600';
      case 'unmatched':
        return 'text-red-600';
      case 'discrepancy':
        return 'text-yellow-600';
      case 'pending':
        return 'text-blue-600';
      case 'resolved':
        return 'text-green-600';
      case 'escalated':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPerformanceColor = (value: number, threshold: number) => {
    if (value >= threshold) return 'text-green-600';
    if (value >= threshold * 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-secondary-900">Reconciliation Analytics</h2>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
              className="input-field w-32"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-secondary-200">
          <nav className="flex space-x-8 px-6">
            {(
              [
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'trends', label: 'Trends', icon: TrendingUp },
                { id: 'systems', label: 'Systems', icon: Database },
                { id: 'performance', label: 'Performance', icon: Activity },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-600">Match Rate</p>
                      <p className="text-2xl font-bold text-green-600">
                        {metrics.matchRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-secondary-500">Target: 95%</p>
                    </div>
                    <Target className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-600">Avg Confidence</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {metrics.averageConfidence.toFixed(1)}%
                      </p>
                      <p className="text-xs text-secondary-500">High quality</p>
                    </div>
                    <Shield className="w-8 h-8 text-blue-500" />
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-600">Processing Time</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {metrics.averageProcessingTime}s
                      </p>
                      <p className="text-xs text-secondary-500">Per record</p>
                    </div>
                    <Clock className="w-8 h-8 text-purple-500" />
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-600">SLA Compliance</p>
                      <p className="text-2xl font-bold text-green-600">
                        {metrics.slaCompliance.toFixed(1)}%
                      </p>
                      <p className="text-xs text-secondary-500">On time</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
              </div>

              {/* Status Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                    Status Distribution
                  </h3>
                  <div className="space-y-3">
                    {[
                      { status: 'matched', count: metrics.matchedRecords, color: 'bg-green-500' },
                      {
                        status: 'discrepancy',
                        count: metrics.discrepancyRecords,
                        color: 'bg-yellow-500',
                      },
                      { status: 'unmatched', count: metrics.unmatchedRecords, color: 'bg-red-500' },
                      { status: 'pending', count: metrics.pendingRecords, color: 'bg-blue-500' },
                      { status: 'resolved', count: metrics.resolvedRecords, color: 'bg-green-600' },
                      { status: 'escalated', count: metrics.escalatedRecords, color: 'bg-red-600' },
                    ].map((item) => (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                          <span className="text-sm font-medium text-secondary-700 capitalize">
                            {item.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-secondary-900">{item.count}</span>
                          <span className="text-xs text-secondary-500">
                            ({((item.count / metrics.totalRecords) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                    Performance Metrics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary-600">Accuracy</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-secondary-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${metrics.accuracy}%` }}
                          />
                        </div>
                        <span
                          className={`text-sm font-medium ${getPerformanceColor(metrics.accuracy, 95)}`}
                        >
                          {metrics.accuracy.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary-600">Throughput</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-secondary-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(metrics.throughput / 200) * 100}%` }}
                          />
                        </div>
                        <span
                          className={`text-sm font-medium ${getPerformanceColor(metrics.throughput, 150)}`}
                        >
                          {metrics.throughput} rec/min
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary-600">Error Rate</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-secondary-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${metrics.errorRate * 10}%` }}
                          />
                        </div>
                        <span
                          className={`text-sm font-medium ${getPerformanceColor(100 - metrics.errorRate, 95)}`}
                        >
                          {metrics.errorRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                    Record Volume Trend
                  </h3>
                  <div className="h-64 flex items-center justify-center bg-secondary-50 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-secondary-400 mx-auto mb-2" />
                      <p className="text-secondary-600">Chart visualization would go here</p>
                      <p className="text-sm text-secondary-500">
                        Using Chart.js or similar library
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                    Match Rate Trend
                  </h3>
                  <div className="h-64 flex items-center justify-center bg-secondary-50 rounded-lg">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 text-secondary-400 mx-auto mb-2" />
                      <p className="text-secondary-600">Chart visualization would go here</p>
                      <p className="text-sm text-secondary-500">
                        Using Chart.js or similar library
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">Recent Trends</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-secondary-200">
                        <th className="text-left py-3 px-4 font-medium text-secondary-700">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-700">
                          Total
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-700">
                          Matched
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-700">
                          Unmatched
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-700">
                          Discrepancy
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-700">
                          Confidence
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTrendData.slice(-10).map((data, index) => (
                        <tr key={index} className="border-b border-secondary-100">
                          <td className="py-3 px-4 text-sm text-secondary-600">
                            {new Date(data.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-secondary-900">
                            {data.total}
                          </td>
                          <td className="py-3 px-4 text-sm text-green-600">{data.matched}</td>
                          <td className="py-3 px-4 text-sm text-red-600">{data.unmatched}</td>
                          <td className="py-3 px-4 text-sm text-yellow-600">{data.discrepancy}</td>
                          <td className="py-3 px-4 text-sm text-blue-600">
                            {data.confidence.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Systems Tab */}
          {activeTab === 'systems' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {systemPerformance.map((system, index) => (
                  <div key={index} className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-secondary-900">
                        {system.systemName}
                      </h3>
                      <span className="text-sm text-secondary-500">{system.systemId}</span>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-secondary-600">Record Count</span>
                        <span className="text-sm font-medium text-secondary-900">
                          {system.recordCount.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-secondary-600">Match Rate</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-secondary-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${system.matchRate}%` }}
                            />
                          </div>
                          <span
                            className={`text-sm font-medium ${getPerformanceColor(system.matchRate, 95)}`}
                          >
                            {system.matchRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-secondary-600">Avg Confidence</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-secondary-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${system.averageConfidence}%` }}
                            />
                          </div>
                          <span
                            className={`text-sm font-medium ${getPerformanceColor(system.averageConfidence, 90)}`}
                          >
                            {system.averageConfidence.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-secondary-600">Processing Time</span>
                        <span
                          className={`text-sm font-medium ${getPerformanceColor(100 - system.processingTime, 80)}`}
                        >
                          {system.processingTime.toFixed(2)}s
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-secondary-600">Error Rate</span>
                        <span
                          className={`text-sm font-medium ${getPerformanceColor(100 - system.errorRate, 95)}`}
                        >
                          {system.errorRate.toFixed(1)}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-secondary-600">Last Sync</span>
                        <span className="text-sm text-secondary-500">
                          {new Date(system.lastSync).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                    Processing Performance
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary-600">Average Processing Time</span>
                      <span className="text-sm font-medium text-secondary-900">
                        {metrics.averageProcessingTime.toFixed(2)}s
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary-600">Throughput</span>
                      <span className="text-sm font-medium text-secondary-900">
                        {metrics.throughput} rec/min
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary-600">Peak Throughput</span>
                      <span className="text-sm font-medium text-secondary-900">
                        {Math.round(metrics.throughput * 1.5)} rec/min
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">Quality Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary-600">Accuracy</span>
                      <span
                        className={`text-sm font-medium ${getPerformanceColor(metrics.accuracy, 95)}`}
                      >
                        {metrics.accuracy.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary-600">Precision</span>
                      <span
                        className={`text-sm font-medium ${getPerformanceColor(metrics.accuracy, 95)}`}
                      >
                        {(metrics.accuracy * 0.98).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary-600">Recall</span>
                      <span
                        className={`text-sm font-medium ${getPerformanceColor(metrics.accuracy, 95)}`}
                      >
                        {(metrics.accuracy * 0.96).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">SLA Compliance</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary-600">Overall SLA</span>
                      <span
                        className={`text-sm font-medium ${getPerformanceColor(metrics.slaCompliance, 95)}`}
                      >
                        {metrics.slaCompliance.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary-600">Processing SLA</span>
                      <span
                        className={`text-sm font-medium ${getPerformanceColor(metrics.slaCompliance, 95)}`}
                      >
                        {(metrics.slaCompliance * 0.99).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary-600">Resolution SLA</span>
                      <span
                        className={`text-sm font-medium ${getPerformanceColor(metrics.slaCompliance, 95)}`}
                      >
                        {(metrics.slaCompliance * 0.97).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                  Performance Trends
                </h3>
                <div className="h-64 flex items-center justify-center bg-secondary-50 rounded-lg">
                  <div className="text-center">
                    <Activity className="w-12 h-12 text-secondary-400 mx-auto mb-2" />
                    <p className="text-secondary-600">Performance trend chart would go here</p>
                    <p className="text-sm text-secondary-500">Using Chart.js or similar library</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 p-6 border-t border-secondary-200">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
          <button className="btn-primary flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReconciliationAnalytics;
