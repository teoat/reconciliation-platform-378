import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Users,
  Target,
} from 'lucide-react';

interface SLOMetric {
  compliant: boolean;
  status: 'good' | 'warning' | 'urgent' | 'critical';
  distance: number;
}

interface SLOCategory {
  compliant: boolean;
  violations: number;
  metrics: { [key: string]: SLOMetric };
}

interface SLOData {
  summary: {
    overallCompliance: boolean;
    overallStatus: string;
    totalViolations: number;
    timestamp: string;
  };
  categories: {
    coreWebVitals: SLOCategory;
    application: SLOCategory;
    userExperience: SLOCategory;
    business: SLOCategory;
  };
  recommendations: string[];
}

interface PerformanceDashboardProps {
  className?: string;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ className = '' }) => {
  const [sloData, setSloData] = useState<SLOData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSLOData();
  }, []);

  const loadSLOData = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch from an API
      // For now, we'll simulate loading the report file
      const response = await fetch('/performance-slo-report.json');
      if (!response.ok) {
        throw new Error('Failed to load SLO data');
      }
      const data = await response.json();
      setSloData(data);
    } catch (err) {
      console.error('Failed to load SLO data:', err);
      setError('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'urgent':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'urgent':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatMetricName = (metric: string) => {
    const names = {
      lcp: 'Largest Contentful Paint',
      fid: 'First Input Delay',
      cls: 'Cumulative Layout Shift',
      initialLoad: 'Initial Load Time',
      navigation: 'Navigation Time',
      apiResponse: 'API Response Time',
      errorRate: 'Error Rate',
      availability: 'Availability',
      responsiveness: 'Responsiveness',
      conversion: 'Conversion Rate',
      taskCompletion: 'Task Completion',
      userSatisfaction: 'User Satisfaction',
    };
    return names[metric as keyof typeof names] || metric;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'coreWebVitals':
        return <Zap className="w-5 h-5" />;
      case 'application':
        return <Clock className="w-5 h-5" />;
      case 'userExperience':
        return <Users className="w-5 h-5" />;
      case 'business':
        return <Target className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !sloData) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center text-red-600">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          <p>{error || 'No performance data available'}</p>
        </div>
      </div>
    );
  }

  const { summary, categories, recommendations } = sloData;

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Performance SLO Dashboard</h2>
            <p className="text-sm text-gray-600 mt-1">
              Service Level Objectives compliance and monitoring
            </p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(summary.overallStatus)}`}
          >
            {summary.overallStatus.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Compliance</p>
                <p
                  className={`text-2xl font-bold ${summary.overallCompliance ? 'text-green-600' : 'text-red-600'}`}
                >
                  {summary.overallCompliance ? 'PASSING' : 'VIOLATIONS'}
                </p>
              </div>
              {getStatusIcon(summary.overallStatus)}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Violations</p>
                <p className="text-2xl font-bold text-red-600">{summary.totalViolations}</p>
              </div>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-blue-600">4</p>
              </div>
              <Target className="w-5 h-5 text-blue-500" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Updated</p>
                <p className="text-sm font-bold text-gray-900">
                  {new Date(summary.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <Clock className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Category Details */}
        <div className="space-y-4">
          {Object.entries(categories).map(([categoryName, category]) => (
            <div key={categoryName} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(categoryName)}
                  <h3 className="font-semibold text-gray-900 capitalize">
                    {categoryName.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      category.compliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {category.violations} violations
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(category.metrics.metrics || category.metrics).map(
                  ([metricName, metric]) => (
                    <div
                      key={metricName}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {formatMetricName(metricName)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {metric.distance > 0 ? '+' : ''}
                          {metric.distance}% from target
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {metric.compliant ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertTriangle
                            className={`w-4 h-4 ${
                              metric.status === 'critical'
                                ? 'text-red-500'
                                : metric.status === 'urgent'
                                  ? 'text-orange-500'
                                  : 'text-yellow-500'
                            }`}
                          />
                        )}
                        <span
                          className={`text-xs px-1 py-0.5 rounded ${
                            metric.status === 'good'
                              ? 'bg-green-100 text-green-700'
                              : metric.status === 'warning'
                                ? 'bg-yellow-100 text-yellow-700'
                                : metric.status === 'urgent'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {metric.status}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-6 border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
              Recommendations
            </h3>
            <div className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-2 p-3 bg-orange-50 border border-orange-200 rounded"
                >
                  <span className="text-orange-600 font-medium text-sm">{index + 1}.</span>
                  <p className="text-sm text-orange-800">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={loadSLOData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Clock className="w-4 h-4" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
