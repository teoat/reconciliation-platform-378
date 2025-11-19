'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { X } from 'lucide-react'
import { Check } from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import { Calendar } from 'lucide-react'
import { Mail } from 'lucide-react'
import { MessageSquare } from 'lucide-react'
import { Users } from 'lucide-react'
import { Download } from 'lucide-react'
import { Upload } from 'lucide-react'
import { RefreshCw } from 'lucide-react'
import { ExternalLink } from 'lucide-react'
import { Key } from 'lucide-react'
import { Globe } from 'lucide-react'
import { Lock } from 'lucide-react'
import { Unlock } from 'lucide-react'
import { Bell } from 'lucide-react'
import { BellOff } from 'lucide-react'
import { Zap } from 'lucide-react'
import { Database } from 'lucide-react'
import { Cloud } from 'lucide-react'
import { Server } from 'lucide-react'
import { Wifi } from 'lucide-react'
import { WifiOff } from 'lucide-react'
import { IntegrationConfig, IntegrationService, ProjectExportService, ExportOptions } from '../services/integration'

interface IntegrationSettingsProps {
  isVisible: boolean
  onClose: () => void
  projects: Array<{ id: string; name: string; [key: string]: unknown }>
}

const IntegrationSettings: React.FC<IntegrationSettingsProps> = ({
  isVisible,
  onClose,
  projects
}) => {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>(
    IntegrationService.getIntegrations()
  )
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null)
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeMetadata: true,
    includeComments: false,
    includeHistory: false
  })
  const [isExporting, setIsExporting] = useState(false)
  interface ExportResult {
    success: boolean
    error?: string
    fileUrl?: string
    fileName?: string
  }
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)

  const handleToggleIntegration = (id: string) => {
    const success = IntegrationService.toggleIntegration(id)
    if (success) {
      setIntegrations(IntegrationService.getIntegrations())
    }
  }

  const handleUpdateIntegration = (id: string, settings: Record<string, unknown>) => {
    const success = IntegrationService.updateIntegration(id, settings)
    if (success) {
      setIntegrations(IntegrationService.getIntegrations())
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await ProjectExportService.exportProjects(projects, exportOptions)
      setExportResult(result)
    } catch (error) {
      setExportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      })
    } finally {
      setIsExporting(false)
    }
  }

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'calendar':
        return <Calendar className="w-5 h-5" />
      case 'email':
        return <Mail className="w-5 h-5" />
      case 'slack':
        return <MessageSquare className="w-5 h-5" />
      case 'teams':
        return <Users className="w-5 h-5" />
      case 'api':
        return <Database className="w-5 h-5" />
      default:
        return <Settings className="w-5 h-5" />
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-secondary-900">
              Integration & Export Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Integrations Section */}
          <div>
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              External Integrations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className={`card cursor-pointer transition-all duration-200 ${
                    integration.enabled ? 'ring-2 ring-green-500 bg-green-50' : ''
                  }`}
                  onClick={() => setSelectedIntegration(integration)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        integration.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {getIntegrationIcon(integration.type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-secondary-900">{integration.name}</h4>
                        <p className="text-sm text-secondary-600 capitalize">{integration.type}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleIntegration(integration.id)
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        integration.enabled 
                          ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {integration.enabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {integration.lastSync && (
                    <div className="text-xs text-secondary-500">
                      Last sync: {new Date(integration.lastSync).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Export Section */}
          <div>
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Data Export
            </h3>
            <div className="card">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Export Format
                    </label>
                    <select
                      value={exportOptions.format}
                      onChange={(e) => setExportOptions(prev => ({ 
                        ...prev, 
                        format: e.target.value as 'csv' | 'excel' | 'json' 
                      }))}
                      className="input-field"
                    >
                      <option value="csv">CSV</option>
                      <option value="excel">Excel</option>
                      <option value="pdf">PDF</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Projects to Export
                    </label>
                    <div className="text-sm text-secondary-600">
                      {projects.length} project{projects.length !== 1 ? 's' : ''} available
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Export Options
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeMetadata}
                        onChange={(e) => setExportOptions(prev => ({ 
                          ...prev, 
                          includeMetadata: e.target.checked 
                        }))}
                        className="rounded border-secondary-300"
                      />
                      <span className="text-sm text-secondary-700">Include metadata (progress, budget, etc.)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeComments}
                        onChange={(e) => setExportOptions(prev => ({ 
                          ...prev, 
                          includeComments: e.target.checked 
                        }))}
                        className="rounded border-secondary-300"
                      />
                      <span className="text-sm text-secondary-700">Include comments and notes</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeHistory}
                        onChange={(e) => setExportOptions(prev => ({ 
                          ...prev, 
                          includeHistory: e.target.checked 
                        }))}
                        className="rounded border-secondary-300"
                      />
                      <span className="text-sm text-secondary-700">Include project history</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-secondary-200">
                  <div className="text-sm text-secondary-600">
                    {isExporting ? 'Exporting...' : 'Ready to export'}
                  </div>
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isExporting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{isExporting ? 'Exporting...' : 'Export Data'}</span>
                  </button>
                </div>

                {exportResult && (
                  <div className={`p-4 rounded-lg ${
                    exportResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {exportResult.success ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={`font-medium ${
                        exportResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {exportResult.success ? 'Export Successful' : 'Export Failed'}
                      </span>
                    </div>
                    {exportResult.success ? (
                      <div className="mt-2 text-sm text-green-700">
                        <p>File: {exportResult.fileName}</p>
                        <p>Size: {(exportResult.fileSize / 1024).toFixed(2)} KB</p>
                        <p>Records: {exportResult.recordCount}</p>
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-red-700">
                        <p>Error: {exportResult.error}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* API Settings Section */}
          <div>
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              API Configuration
            </h3>
            <div className="card">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-secondary-900">REST API</h4>
                    <p className="text-sm text-secondary-600">
                      Enable API access for external integrations
                    </p>
                  </div>
                  <button className="btn-secondary">
                    <ExternalLink className="w-4 h-4" />
                    <span>Configure</span>
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-secondary-900">Webhook Endpoints</h4>
                    <p className="text-sm text-secondary-600">
                      Set up webhooks for real-time notifications
                    </p>
                  </div>
                  <button className="btn-secondary">
                    <Zap className="w-4 h-4" />
                    <span>Setup</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 p-6 border-t border-secondary-200">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default IntegrationSettings
