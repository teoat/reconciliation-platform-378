'use client'

import { useState } from 'react'
import { 
  Download, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  User,
  Calendar,
  Settings,
  Mail,
  Printer,
  Share2,
  Archive
} from 'lucide-react'

interface ExportFormat {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  size: string
}

interface ReportSection {
  id: string
  title: string
  included: boolean
  description: string
}

interface SummaryExportPageProps {
  project: any
}

const SummaryExportPage = ({ project }: SummaryExportPageProps) => {
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf')
  const [selectedSections, setSelectedSections] = useState<string[]>(['summary', 'details', 'discrepancies'])
  const [emailRecipients, setEmailRecipients] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const exportFormats: ExportFormat[] = [
    {
      id: 'pdf',
      name: 'PDF Report',
      description: 'Comprehensive report with charts and tables',
      icon: <FileText className="w-6 h-6" />,
      size: '2.3 MB'
    },
    {
      id: 'excel',
      name: 'Excel Workbook',
      description: 'Detailed data in spreadsheet format',
      icon: <FileText className="w-6 h-6" />,
      size: '1.8 MB'
    },
    {
      id: 'csv',
      name: 'CSV Files',
      description: 'Raw data files for further analysis',
      icon: <FileText className="w-6 h-6" />,
      size: '0.9 MB'
    },
    {
      id: 'json',
      name: 'JSON Data',
      description: 'Machine-readable data format',
      icon: <FileText className="w-6 h-6" />,
      size: '1.2 MB'
    }
  ]

  const reportSections: ReportSection[] = [
    {
      id: 'summary',
      title: 'Executive Summary',
      included: true,
      description: 'High-level overview of reconciliation results'
    },
    {
      id: 'details',
      title: 'Detailed Results',
      included: true,
      description: 'Complete record-by-record reconciliation data'
    },
    {
      id: 'discrepancies',
      title: 'Discrepancy Analysis',
      included: true,
      description: 'Analysis of unmatched and discrepant records'
    },
    {
      id: 'charts',
      title: 'Visualizations',
      included: false,
      description: 'Charts and graphs showing trends and patterns'
    },
    {
      id: 'audit',
      title: 'Audit Trail',
      included: false,
      description: 'Complete log of all reconciliation activities'
    },
    {
      id: 'recommendations',
      title: 'Recommendations',
      included: false,
      description: 'Suggestions for improving reconciliation processes'
    }
  ]

  const finalStats = {
    projectName: project?.name || 'Q4 2023 Financial Reconciliation',
    generatedDate: new Date().toISOString(),
    generatedBy: 'Current User',
    totalRecords: 4650,
    matchedRecords: 4000,
    unmatchedRecords: 450,
    discrepancyRecords: 200,
    totalAmount: 4300000,
    discrepancyAmount: 40000,
    matchRate: 86.0,
    processingTime: '2h 15m',
    categories: [
      { name: 'Payment Transactions', records: 1250, matchRate: 86.4 },
      { name: 'Customer Records', records: 850, matchRate: 96.5 },
      { name: 'Inventory Items', records: 2100, matchRate: 92.9 },
      { name: 'Financial Statements', records: 450, matchRate: 100.0 }
    ]
  }

  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const generateReport = () => {
    setIsGenerating(true)
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false)
      alert('Report generated successfully!')
    }, 3000)
  }

  const sendEmail = () => {
    if (!emailRecipients.trim()) {
      alert('Please enter email recipients')
      return
    }
    alert(`Report will be sent to: ${emailRecipients}`)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          Summary & Export
        </h1>
        <p className="text-secondary-600">
          Generate final reconciliation reports and export data
        </p>
        {project && (
          <div className="mt-2 text-sm text-primary-600">
            Project: {project.name}
          </div>
        )}
      </div>

      {/* Final Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Records</p>
              <p className="text-2xl font-bold text-secondary-900">{finalStats.totalRecords.toLocaleString()}</p>
            </div>
            <FileText className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Match Rate</p>
              <p className="text-2xl font-bold text-green-600">{finalStats.matchRate}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Amount</p>
              <p className="text-2xl font-bold text-secondary-900">${finalStats.totalAmount.toLocaleString()}</p>
            </div>
            <FileText className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Processing Time</p>
              <p className="text-2xl font-bold text-blue-600">{finalStats.processingTime}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Export Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Export Format */}
          <div className="card">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">
              Export Format
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exportFormats.map((format) => (
                <div
                  key={format.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedFormat === format.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-secondary-200 hover:border-secondary-300'
                  }`}
                  onClick={() => setSelectedFormat(format.id)}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    {format.icon}
                    <h3 className="font-semibold text-secondary-900">{format.name}</h3>
                  </div>
                  <p className="text-sm text-secondary-600 mb-2">{format.description}</p>
                  <p className="text-xs text-secondary-500">Size: {format.size}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Report Sections */}
          <div className="card">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">
              Report Sections
            </h2>
            <div className="space-y-3">
              {reportSections.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedSections.includes(section.id)}
                      onChange={() => toggleSection(section.id)}
                      className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                    />
                    <div>
                      <h3 className="font-medium text-secondary-900">{section.title}</h3>
                      <p className="text-sm text-secondary-600">{section.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email Distribution */}
          <div className="card">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">
              Email Distribution
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Recipients
                </label>
                <input
                  type="text"
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  placeholder="Enter email addresses separated by commas"
                  className="input-field"
                />
              </div>
              <button
                onClick={sendEmail}
                className="btn-secondary flex items-center space-x-2"
              >
                <Mail className="w-4 h-4" />
                <span>Send Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Details */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">
              Report Summary
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-secondary-700 mb-2">Project Information</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Project:</span>
                    <span className="font-medium">{finalStats.projectName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Generated:</span>
                    <span className="font-medium">{new Date(finalStats.generatedDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">By:</span>
                    <span className="font-medium">{finalStats.generatedBy}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-secondary-700 mb-2">Results Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Total Records:</span>
                    <span className="font-medium">{finalStats.totalRecords.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Matched:</span>
                    <span className="font-medium text-green-600">{finalStats.matchedRecords.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Unmatched:</span>
                    <span className="font-medium text-red-600">{finalStats.unmatchedRecords.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Discrepancies:</span>
                    <span className="font-medium text-yellow-600">{finalStats.discrepancyRecords.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Match Rate:</span>
                    <span className="font-medium text-primary-600">{finalStats.matchRate}%</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-secondary-700 mb-2">Amount Analysis</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Total Amount:</span>
                    <span className="font-medium">${finalStats.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Discrepancy:</span>
                    <span className="font-medium text-red-600">${finalStats.discrepancyAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-secondary-700 mb-2">Categories</h3>
                <div className="space-y-2">
                  {finalStats.categories.map((category, index) => (
                    <div key={index} className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-secondary-600">{category.name}:</span>
                        <span className="font-medium">{category.matchRate}%</span>
                      </div>
                      <div className="text-xs text-secondary-500">
                        {category.records.toLocaleString()} records
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Export Actions */}
          <div className="card mt-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Export Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={generateReport}
                disabled={isGenerating}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : 'Generate Report'}
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-secondary text-sm flex items-center justify-center space-x-1">
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
                <button className="btn-secondary text-sm flex items-center justify-center space-x-1">
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
              
              <button className="w-full btn-secondary text-sm flex items-center justify-center space-x-2">
                <Archive className="w-4 h-4" />
                <span>Archive Project</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Final Actions */}
      <div className="card mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              Reconciliation Complete
            </h3>
            <p className="text-secondary-600">
              All reconciliation processes have been completed successfully. 
              You can now generate reports and export data.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary">
              Start New Project
            </button>
            <button className="btn-primary">
              Complete & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SummaryExportPage
