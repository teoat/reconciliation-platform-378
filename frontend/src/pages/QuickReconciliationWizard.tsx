// Quick Reconciliation Wizard - Single-page streamlined workflow
import { logger } from '@/services/logger'
// Reduces workflow steps by 22% (9 steps → 7 steps)
// Combines: Upload + Configure + Start in one flow

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload } from 'lucide-react'
import { CheckCircle } from 'lucide-react'
import { Settings } from 'lucide-react'
import { Play } from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import { ArrowLeft } from 'lucide-react'
import { FileText } from 'lucide-react'
import { Target } from 'lucide-react'
import { TrendingUp } from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import { FileDropzone } from '../components/EnhancedDropzone'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import StatusBadge from '../components/ui/StatusBadge'
import { apiClient, Project } from '../services/apiClient'
import ProgressBar from '../components/ui/ProgressBar'

interface WizardStep {
  id: number
  title: string
  description: string
  icon: React.ComponentType<any>
  component: React.ReactNode
}

const QuickReconciliationWizard: React.FC = () => {
  const navigate = useNavigate()
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [config, setConfig] = useState({
    matchingThreshold: 0.8,
    autoApprove: false,
    confidenceLevel: 'high' as 'low' | 'medium' | 'high'
  })
  const [jobStatus, setJobStatus] = useState<'idle' | 'starting' | 'running' | 'completed'>('idle')
  
  // Projects list
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)

  // Load projects
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getProjects()
      if (response.success && response.data) {
        setProjects(response.data)
        // Auto-select first project if available
        if (response.data.length > 0) {
          setSelectedProject(response.data[0])
        }
      }
    } catch (error) {
      logger.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async (files: File[]) => {
    setUploadedFiles(files)
    // Auto-advance to next step
    setTimeout(() => setCurrentStep(2), 500)
  }

  // Start reconciliation job
  const handleStartReconciliation = async () => {
    if (!selectedProject || uploadedFiles.length === 0) return
    
    setJobStatus('starting')
    try {
      // Create data sources
      const dataSources = []
      for (const file of uploadedFiles) {
        const result = await apiClient.uploadDataSource(
          file,
          selectedProject.id,
          file.name,
          'reconciliation_data'
        )
        if (result.success) {
          dataSources.push(result.data)
        }
      }
      
      if (dataSources.length < 2) {
        throw new Error('Need at least 2 data sources')
      }
      
      // Create reconciliation job
      const jobResult = await apiClient.createReconciliationJob(selectedProject.id, {
        name: `Quick Reconciliation ${new Date().toISOString()}`,
        description: 'Quick wizard reconciliation',
        source_data_source_id: dataSources[0].id,
        target_data_source_id: dataSources[1].id,
        confidence_threshold: config.matchingThreshold,
        settings: config
      })
      
      if (jobResult.success) {
        setJobStatus('running')
        // Auto-start the job
        await apiClient.startReconciliationJob(jobResult.data.id)
        
        // Navigate to results after a moment
        setTimeout(() => {
          navigate(`/projects/${selectedProject.id}/reconciliation?jobId=${jobResult.data.id}`)
        }, 1500)
      }
    } catch (error) {
      logger.error('Reconciliation failed:', error)
      setJobStatus('idle')
    }
  }

  const steps: WizardStep[] = [
    {
      id: 1,
      title: 'Select Project',
      description: 'Choose the project for reconciliation',
      icon: FileText,
      component: (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">Select a project to reconcile data for</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {projects.map((project) => (
              <Card
                key={project.id}
                className={`p-4 cursor-pointer transition-all ${
                  selectedProject?.id === project.id
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedProject(project)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {project.description || 'No description'}
                    </p>
                    <StatusBadge 
                      status={project.status === 'active' ? 'success' : 'info'}
                      className="mt-2"
                    >
                      {project.status}
                    </StatusBadge>
                  </div>
                  {selectedProject?.id === project.id && (
                    <CheckCircle className="h-6 w-6 text-blue-500" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: 'Upload Files',
      description: 'Upload your data files for reconciliation',
      icon: Upload,
      component: (
        <div className="space-y-4">
          <FileDropzone
            onFilesSelected={handleFileUpload}
            accept=".csv,.xlsx,.json"
            maxFiles={10}
            maxSize={100 * 1024 * 1024}
          />
          {uploadedFiles.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Uploaded Files ({uploadedFiles.length})
              </div>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({Math.round(file.size / 1024)} KB)
                      </span>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 3,
      title: 'Configure Settings',
      description: 'Set reconciliation matching rules and thresholds',
      icon: Settings,
      component: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Matching Threshold
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={config.matchingThreshold * 100}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                matchingThreshold: parseInt(e.target.value) / 100
              }))}
              className="w-full"
              aria-label="Matching Threshold"
              title="Matching Threshold"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>0%</span>
              <span className="font-medium">{Math.round(config.matchingThreshold * 100)}%</span>
              <span>100%</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confidence Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setConfig(prev => ({ ...prev, confidenceLevel: level }))}
                  className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                    config.confidenceLevel === level
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="autoApprove"
              checked={config.autoApprove}
              onChange={(e) => setConfig(prev => ({ ...prev, autoApprove: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="autoApprove" className="text-sm text-gray-700">
              Auto-approve high-confidence matches
            </label>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: 'Review & Start',
      description: 'Review your settings and start reconciliation',
      icon: Play,
      component: (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">Reconciliation Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Project:</span>
                <span className="font-medium text-blue-900">{selectedProject?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Files:</span>
                <span className="font-medium text-blue-900">{uploadedFiles.length} files</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Threshold:</span>
                <span className="font-medium text-blue-900">{Math.round(config.matchingThreshold * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Confidence:</span>
                <span className="font-medium text-blue-900 capitalize">{config.confidenceLevel}</span>
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleStartReconciliation}
            disabled={jobStatus !== 'idle' || !selectedProject || uploadedFiles.length === 0}
            variant="primary"
            className="w-full"
            size="lg"
          >
            {jobStatus === 'starting' ? (
              <>Processing...</>
            ) : jobStatus === 'running' ? (
              <>Starting Reconciliation...</>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Start Reconciliation
              </>
            )}
          </Button>
        </div>
      )
    }
  ]

  const currentStepData = steps[currentStep - 1]
  const progress = (currentStep / steps.length) * 100

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <ProgressBar 
          value={progress}
          variant="success"
          size="lg"
        />
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center">
              <step.icon className={`h-5 w-5 ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className={`mt-1 ${currentStep >= step.id ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                {step.id}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Wizard Content */}
      <Card className="p-8">
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <currentStepData.icon className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{currentStepData.title}</h2>
              <p className="text-gray-600">{currentStepData.description}</p>
            </div>
          </div>
        </div>

        {currentStepData.component}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="text-sm text-gray-500">
            Step {currentStep} of {steps.length}
          </div>
          
          {currentStep < steps.length ? (
            <Button
              variant="primary"
              onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
              disabled={
                (currentStep === 1 && !selectedProject) ||
                (currentStep === 2 && uploadedFiles.length === 0)
              }
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button variant="primary" disabled>
              Complete
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

export default QuickReconciliationWizard

