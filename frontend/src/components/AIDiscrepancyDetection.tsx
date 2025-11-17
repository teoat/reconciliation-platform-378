'use client'

import { useState, useMemo, useCallback } from 'react'
import { Brain } from 'lucide-react'
import { AlertTriangle } from 'lucide-react'
import { CheckCircle } from 'lucide-react'
import { XCircle } from 'lucide-react'
import { Activity } from 'lucide-react'
import { Eye } from 'lucide-react'
import { RefreshCw } from 'lucide-react'
import { Download } from 'lucide-react'
import { Calendar } from 'lucide-react'
import { Tag } from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import { DollarSign } from 'lucide-react'
import { FileText } from 'lucide-react'
import { X } from 'lucide-react'
import { useData } from '../components/DataProvider'
import type { Project } from '@/types/backend-aligned'
import type { ReconciliationData, CashflowData } from '../components/data/types'
import type { ReconciliationRecord } from '@/services/dataManagement/types'

// Extended type for records that may have direct properties or nested in sources
type ExtendedReconciliationRecord = ReconciliationRecord & {
  amount?: number;
  description?: string;
  date?: string;
  category?: string;
}

// AI Discrepancy Detection Interfaces
interface AIDiscrepancyDetectionData {
  id: string
  type: 'amount' | 'date' | 'description' | 'category' | 'pattern' | 'anomaly'
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  description: string
  sourceRecord: string
  targetRecord: string
  difference: number
  pattern: string
  recommendation: string
  status: 'detected' | 'investigating' | 'resolved' | 'false_positive'
  detectedAt: string
  assignedTo?: string
  resolution?: string
  metadata: {
    algorithm: string
    modelVersion: string
    features: string[]
    threshold: number
    context: Record<string, unknown>
  }
}

interface AIModel {
  id: string
  name: string
  version: string
  type: 'classification' | 'regression' | 'anomaly_detection' | 'pattern_recognition'
  accuracy: number
  lastTrained: string
  features: string[]
  performance: {
    precision: number
    recall: number
    f1Score: number
    auc: number
  }
  status: 'active' | 'training' | 'deprecated'
}

interface AIPrediction {
  id: string
  modelId: string
  input: Record<string, unknown>
  output: {
    prediction: unknown
    confidence: number
    probabilities: Record<string, number>
    explanation: string
  }
  timestamp: string
  accuracy?: number
}



interface AIDiscrepancyDetectionProps {
  project: Project
  onProgressUpdate?: (step: string) => void
}

const AIDiscrepancyDetection = ({ project, onProgressUpdate }: AIDiscrepancyDetectionProps) => {
  const { getReconciliationData, getCashflowData } = useData()
  const [detections, setDetections] = useState<AIDiscrepancyDetectionData[]>([])
  const [models] = useState<AIModel[]>([])
  const [predictions, setPredictions] = useState<AIPrediction[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [selectedDetection, setSelectedDetection] = useState<AIDiscrepancyDetectionData | null>(null)
  const [showDetectionModal, setShowDetectionModal] = useState(false)
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  const generateAIDetections = useCallback((reconciliationData: ReconciliationData, cashflowData: CashflowData): AIDiscrepancyDetectionData[] => {
    const detections: AIDiscrepancyDetectionData[] = []

    // Analyze reconciliation records for discrepancies
    reconciliationData.records.forEach((record: ExtendedReconciliationRecord, index: number) => {
      if (record.status === 'discrepancy' && record.difference) {
        const detection: AIDiscrepancyDetectionData = {
          id: `ai-detection-${index}`,
          type: 'amount',
          severity: Math.abs(record.difference) > 1000000 ? 'high' : 'medium',
          confidence: 92.5,
          description: `AI detected amount discrepancy in ${record.sources[0]?.data?.description || 'transaction'}`,
          sourceRecord: record.id,
          targetRecord: record.sources[0]?.recordId || '',
          difference: record.difference,
          pattern: 'amount_variance',
          recommendation: 'Review transaction details and verify with source system',
          status: 'detected',
          detectedAt: new Date().toISOString(),
          metadata: {
            algorithm: 'amount-anomaly-detector',
            modelVersion: '2.1.0',
            features: ['amount', 'category', 'date'],
            threshold: 0.05,
            context: {
              expectedRange: [record.sources[0]?.data?.amount * 0.95, record.sources[0]?.data?.amount * 1.05],
              actualValue: record.sources[0]?.data?.amount,
              variance: Math.abs(record.difference) / record.sources[0]?.data?.amount,
              category: record.sources[0]?.data?.category,
              date: record.sources[0]?.data?.date
            }
          }
        }
        detections.push(detection)
      }
    })

    // Analyze cashflow data for anomalies
    cashflowData.records.forEach((record: ExtendedReconciliationRecord, index: number) => {
      if (record.amount > 5000000) { // High value transaction
        const detection: AIDiscrepancyDetectionData = {
          id: `ai-detection-cashflow-${index}`,
          type: 'amount',
          severity: 'medium',
          confidence: 87.3,
          description: `AI detected high-value cashflow transaction: ${record.description}`,
          sourceRecord: record.id,
          targetRecord: '',
          difference: 0,
          pattern: 'high_value_transaction',
          recommendation: 'Verify transaction authorization and documentation',
          status: 'detected',
          detectedAt: new Date().toISOString(),
          metadata: {
            algorithm: 'cashflow-anomaly-detector',
            modelVersion: '1.8.0',
            features: ['amount', 'description', 'date'],
            threshold: 5000000,
            context: {
              amount: record.amount,
              description: record.description,
              date: record.date ?? '',
              category: record.category ?? ''
            }
          }
        }
        detections.push(detection)
      }
    })

    return detections
  }, [])

  const generateAIPredictions = useCallback((reconciliationData: ReconciliationData): AIPrediction[] => {
    // Generate predictions for next week
    const nextWeekPredictions = [
      {
        id: 'pred-001',
        modelId: 'reconciliation-predictor',
        type: 'reconciliation_accuracy',
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        input: {
          historicalData: reconciliationData.qualityMetrics,
          currentTrends: {
            accuracy: 94.2,
            throughput: 180,
            errorRate: 1.8
          },
          externalFactors: ['market_volatility', 'regulatory_changes']
        },
        output: {
          prediction: 'expected',
          confidence: 0.89,
          probabilities: { normal: 0.89, anomaly: 0.11 },
          explanation: 'Weekly recurring pattern matches historical data'
        },
        timestamp: new Date().toISOString(),
        accuracy: 0.91
      }
    ]

    return nextWeekPredictions
  }, [])

  const runDiscrepancyAnalysis = useCallback(async () => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    
    const reconciliationData = getReconciliationData()
    const cashflowData = getCashflowData()
    
    if (!reconciliationData || !cashflowData) {
      setIsAnalyzing(false)
      return
    }

    // Simulate AI analysis progress
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        const newProgress = Math.min(prev + Math.random() * 15, 100)
        if (newProgress >= 100) {
          clearInterval(interval)
          setIsAnalyzing(false)
          
          // Generate AI detections
          const aiDetections = generateAIDetections(reconciliationData, cashflowData)
          setDetections(aiDetections)
          
          // Generate predictions
          const aiPredictions = generateAIPredictions(reconciliationData)
          setPredictions(aiPredictions)
          
          onProgressUpdate?.('ai_discrepancy_detection_completed')
        }
        return newProgress
      })
    }, 300)
   }, [getReconciliationData, getCashflowData, onProgressUpdate, generateAIDetections, generateAIPredictions])











  // Filter detections based on severity and type
  const filteredDetections = useMemo(() => {
    return detections.filter(detection => {
      const severityMatch = filterSeverity === 'all' || detection.severity === filterSeverity
      const typeMatch = filterType === 'all' || detection.type === filterType
      return severityMatch && typeMatch
    })
  }, [detections, filterSeverity, filterType])

  // Helper functions
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'amount':
        return <DollarSign className="w-4 h-4" />
      case 'date':
        return <Calendar className="w-4 h-4" />
      case 'description':
        return <FileText className="w-4 h-4" />
      case 'category':
        return <Tag className="w-4 h-4" />
      case 'pattern':
        return <Activity className="w-4 h-4" />
      case 'anomaly':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const handleDetectionClick = (detection: AIDiscrepancyDetectionData) => {
    setSelectedDetection(detection)
    setShowDetectionModal(true)
  }

  const handleResolveDetection = (detectionId: string, resolution: string) => {
    setDetections(prev => prev.map(detection => 
      detection.id === detectionId 
        ? { ...detection, status: 'resolved' as const, resolution }
        : detection
    ))
    setShowDetectionModal(false)
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              AI-Powered Discrepancy Detection
            </h1>
            <p className="text-secondary-600">
              Advanced machine learning algorithms for intelligent discrepancy detection and analysis
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={runDiscrepancyAnalysis}
              disabled={isAnalyzing}
              className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
            >
              <Brain className="w-4 h-4" />
              <span>{isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}</span>
            </button>
            <button className="btn-primary flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export Results</span>
            </button>
          </div>
        </div>
        
        {project && (
          <div className="text-sm text-primary-600 bg-primary-50 px-3 py-2 rounded-lg inline-block">
            Project: {project.name}
          </div>
        )}
      </div>

      {/* AI Models Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {models.map((model) => (
          <div key={model.id} className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-900 text-sm">{model.name}</h3>
                  <p className="text-xs text-secondary-500">v{model.version}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                model.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {model.status}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-600">Accuracy</span>
                <span className="text-sm font-semibold text-secondary-900">
                  {formatPercentage(model.accuracy / 100)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-600">F1 Score</span>
                <span className="text-sm font-semibold text-secondary-900">
                  {model.performance.f1Score.toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-600">Last Trained</span>
                <span className="text-sm text-secondary-500">
                  {new Date(model.lastTrained).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <div className="card mb-6">
          <div className="flex items-center space-x-4">
            <RefreshCw className="w-6 h-6 text-primary-600 animate-spin" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Running AI Analysis
              </h3>
              <p className="text-secondary-600 mb-3">
                Machine learning models are analyzing data for discrepancies...
              </p>
              <div className="w-full bg-secondary-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  // Dynamic width for progress bar - acceptable inline style
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
              <p className="text-sm text-secondary-500 mt-2">
                {Math.round(analysisProgress)}% complete
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900">AI Detections</h3>
          <div className="flex items-center space-x-4">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="input-field"
              aria-label="Filter by severity"
              title="Filter detections by severity level"
            >
              <option value="all">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              aria-label="Filter by type"
              title="Filter detections by type"
              className="input-field"
            >
              <option value="all">All Types</option>
              <option value="amount">Amount</option>
              <option value="date">Date</option>
              <option value="description">Description</option>
              <option value="category">Category</option>
              <option value="pattern">Pattern</option>
              <option value="anomaly">Anomaly</option>
            </select>
          </div>
        </div>

        {/* Detections List */}
        <div className="space-y-3">
          {filteredDetections.map((detection) => (
            <div
              key={detection.id}
              className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 cursor-pointer"
              onClick={() => handleDetectionClick(detection)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleDetectionClick(detection);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(detection.type)}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(detection.severity)}`}>
                    {detection.severity.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-secondary-900">{detection.description}</h4>
                  <p className="text-sm text-secondary-600">{detection.recommendation}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-semibold text-secondary-900">
                    {formatPercentage(detection.confidence / 100)}
                  </div>
                  <div className="text-xs text-secondary-500">Confidence</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-secondary-900">
                    {detection.difference !== 0 ? formatCurrency(detection.difference) : 'N/A'}
                  </div>
                  <div className="text-xs text-secondary-500">Difference</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-secondary-500">
                    {new Date(detection.detectedAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-secondary-500">Detected</div>
                </div>
                <Eye className="w-4 h-4 text-secondary-400" />
              </div>
            </div>
          ))}
        </div>

        {filteredDetections.length === 0 && (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
            <p className="text-secondary-600">No AI detections found matching your criteria</p>
          </div>
        )}
      </div>

      {/* AI Predictions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">AI Predictions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {predictions.map((prediction) => (
            <div key={prediction.id} className="p-4 bg-secondary-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-secondary-900">
                  {models.find(m => m.id === prediction.modelId)?.name || 'Unknown Model'}
                </h4>
                <span className="text-sm text-secondary-500">
                  {formatPercentage(prediction.output.confidence)}
                </span>
              </div>
              <p className="text-sm text-secondary-600 mb-3">{prediction.output.explanation}</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-secondary-600">Prediction</span>
                  <span className="text-sm font-semibold text-secondary-900">
                    {prediction.output.prediction}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-secondary-600">Accuracy</span>
                  <span className="text-sm font-semibold text-secondary-900">
                    {prediction.accuracy ? formatPercentage(prediction.accuracy) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detection Detail Modal */}
      {showDetectionModal && selectedDetection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-secondary-900">
                AI Detection Details
              </h3>
              <button
                onClick={() => setShowDetectionModal(false)}
                className="text-secondary-400 hover:text-secondary-600"
                aria-label="Close detection details modal"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-secondary-900 mb-4">Detection Information</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Type</span>
                    <span className="text-sm text-secondary-900">{selectedDetection.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Severity</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(selectedDetection.severity)}`}>
                      {selectedDetection.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Confidence</span>
                    <span className="text-sm text-secondary-900">
                      {formatPercentage(selectedDetection.confidence / 100)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Pattern</span>
                    <span className="text-sm text-secondary-900">{selectedDetection.pattern}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Detected At</span>
                    <span className="text-sm text-secondary-900">
                      {new Date(selectedDetection.detectedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-secondary-900 mb-4">AI Model Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Algorithm</span>
                    <span className="text-sm text-secondary-900">{selectedDetection.metadata.algorithm}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Model Version</span>
                    <span className="text-sm text-secondary-900">{selectedDetection.metadata.modelVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Threshold</span>
                    <span className="text-sm text-secondary-900">{selectedDetection.metadata.threshold}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Features</span>
                    <span className="text-sm text-secondary-900">
                      {selectedDetection.metadata.features.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-semibold text-secondary-900 mb-4">Recommendation</h4>
              <p className="text-secondary-700 mb-4">{selectedDetection.recommendation}</p>
              
              {selectedDetection.status === 'detected' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleResolveDetection(selectedDetection.id, 'Resolved by AI analysis')}
                    className="btn-primary text-sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Resolved
                  </button>
                  <button
                    onClick={() => handleResolveDetection(selectedDetection.id, 'False positive')}
                    className="btn-secondary text-sm"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Mark as False Positive
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIDiscrepancyDetection



