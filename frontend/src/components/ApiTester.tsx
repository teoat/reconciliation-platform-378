import React, { useState, useCallback } from 'react'
import { Play } from 'lucide-react'
import { Code } from 'lucide-react'
import { Copy } from 'lucide-react'
import { Download } from 'lucide-react'
// Icons imported but not used - removed to fix linting warnings
import { CheckCircle } from 'lucide-react'
import { XCircle } from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import ApiService from '../services/ApiService'
import Button from './ui/Button'
import Card from './ui/Card'
import Input from './ui/Input'
import Select from './ui/Select'
import { PageMeta } from './seo/PageMeta'
import { useNotificationHelpers } from '../store/hooks'

interface ApiTesterProps {
  className?: string
}

interface ApiTestResult {
  endpoint: string
  method: string
  status: 'success' | 'error' | 'pending'
  response?: Record<string, unknown> | unknown[]
  error?: string
  duration?: number
  timestamp: Date
}

const ApiTester: React.FC<ApiTesterProps> = ({ className = '' }) => {
  const [testResults, setTestResults] = useState<ApiTestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [selectedEndpoint, setSelectedEndpoint] = useState('')
  const [customEndpoint, setCustomEndpoint] = useState('')
  const [requestBody, setRequestBody] = useState('')
  const [responseBody, setResponseBody] = useState('')
  const { showSuccess, showError } = useNotificationHelpers()

  const apiEndpoints = [
    { value: 'health', label: 'Health Check', method: 'GET', endpoint: '/health' },
    { value: 'auth-me', label: 'Get Current User', method: 'GET', endpoint: '/auth/me' },
    { value: 'projects', label: 'Get Projects', method: 'GET', endpoint: '/projects' },
    { value: 'users', label: 'Get Users', method: 'GET', endpoint: '/users' },
    { value: 'dashboard', label: 'Dashboard Data', method: 'GET', endpoint: '/analytics/dashboard' },
    { value: 'custom', label: 'Custom Endpoint', method: 'GET', endpoint: '' }
  ]

  const runApiTest = useCallback(async (
    endpoint: string,
    method: string,
    body?: Record<string, unknown> | unknown[]
  ) => {
    const startTime = Date.now()
    const timestamp = new Date()
    
    // Add pending result
    const pendingResult: ApiTestResult = {
      endpoint,
      method,
      status: 'pending',
      timestamp
    }
    
    setTestResults(prev => [pendingResult, ...prev])
    
    try {
      let response: Record<string, unknown> | unknown[] | undefined
      
      // Execute the appropriate API call based on endpoint
      switch (endpoint) {
        case '/health':
          response = await ApiService.healthCheck()
          break
        case '/auth/me':
          response = await ApiService.getCurrentUser()
          break
        case '/projects':
          response = await ApiService.getProjects()
          break
        case '/users':
          response = await ApiService.getUsers()
          break
        case '/analytics/dashboard':
          response = await ApiService.getDashboardData()
          break
        default:
          throw new Error(`Unknown endpoint: ${endpoint}`)
      }
      
      const duration = Date.now() - startTime
      
      const successResult: ApiTestResult = {
        endpoint,
        method,
        status: 'success',
        response,
        duration,
        timestamp
      }
      
      setTestResults(prev => 
        prev.map(result => 
          result.timestamp === timestamp ? successResult : result
        )
      )
      
      setResponseBody(JSON.stringify(response, null, 2))
      showSuccess('API Test Successful', `Endpoint ${endpoint} responded successfully`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      const errorResult: ApiTestResult = {
        endpoint,
        method,
        status: 'error',
        error: errorMessage,
        duration,
        timestamp
      }
      
      setTestResults(prev => 
        prev.map(result => 
          result.timestamp === timestamp ? errorResult : result
        )
      )
      
      setResponseBody(JSON.stringify({ error: errorMessage }, null, 2))
      showError('API Test Failed', errorMessage)
    }
  }, [showSuccess, showError])

  const handleRunTest = useCallback(() => {
    if (!selectedEndpoint) return
    
    const endpoint = selectedEndpoint === 'custom' ? customEndpoint : selectedEndpoint
    if (!endpoint) return
    
    const method = apiEndpoints.find(ep => ep.value === selectedEndpoint)?.method || 'GET'
    const body = requestBody ? JSON.parse(requestBody) : undefined
    
    runApiTest(endpoint, method, body)
  }, [selectedEndpoint, customEndpoint, requestBody, runApiTest])

  const handleRunAllTests = useCallback(async () => {
    setIsRunning(true)
    
    try {
      for (const endpoint of apiEndpoints.filter(ep => ep.value !== 'custom')) {
        await runApiTest(endpoint.endpoint, endpoint.method)
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } finally {
      setIsRunning(false)
    }
  }, [runApiTest])

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    showSuccess('Copied', 'Response copied to clipboard')
  }, [showSuccess])

  const downloadResults = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      results: testResults
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `api-test-results-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    showSuccess('Downloaded', 'Test results downloaded successfully')
  }, [testResults, showSuccess])

  const clearResults = useCallback(() => {
    setTestResults([])
    setResponseBody('')
  }, [])

  const getStatusIcon = (status: ApiTestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: ApiTestResult['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'pending':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <>
      <PageMeta
        title="API Tester"
        description="Test API endpoints, view responses, and debug integration issues."
        keywords="API, tester, testing, endpoints, debugging"
      />
      <main id="main-content" role="main" className={`space-y-6 ${className}`}>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">API Tester</h1>
      {/* API Test Controls */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">API Testing Console</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={downloadResults}
                disabled={testResults.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                Download Results
              </Button>
              <Button
                variant="outline"
                onClick={clearResults}
                disabled={testResults.length === 0}
              >
                Clear Results
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Endpoint
              </label>
              <Select
                value={selectedEndpoint}
                onChange={(e) => setSelectedEndpoint(e.target.value)}
                options={apiEndpoints.map(ep => ({
                  value: ep.value,
                  label: `${ep.method} ${ep.label}`
                }))}
              />
            </div>
            
            {selectedEndpoint === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Endpoint
                </label>
                <Input
                  value={customEndpoint}
                  onChange={(e) => setCustomEndpoint(e.target.value)}
                  placeholder="/api/custom-endpoint"
                />
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Request Body (JSON)
            </label>
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder='{"key": "value"}'
            />
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="primary"
              onClick={handleRunTest}
              disabled={!selectedEndpoint || isRunning}
            >
              <Play className="h-4 w-4 mr-1" />
              Run Test
            </Button>
            
            <Button
              variant="outline"
              onClick={handleRunAllTests}
              disabled={isRunning}
            >
              <Database className="h-4 w-4 mr-1" />
              Run All Tests
            </Button>
          </div>
        </div>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h3>
            
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {result.method} {result.endpoint}
                      </p>
                      <p className="text-xs text-gray-500">
                        {result.timestamp.toLocaleTimeString()}
                        {result.duration && ` • ${result.duration}ms`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${getStatusColor(result.status)}`}>
                      {result.status}
                    </span>
                    {result.error && (
                      <span className="text-xs text-red-600 max-w-xs truncate">
                        {result.error}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Response Viewer */}
      {responseBody && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Response</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(responseBody)}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
            </div>
            
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{responseBody}</code>
            </pre>
          </div>
        </Card>
      )}

      {/* API Endpoints Reference */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Endpoints</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {apiEndpoints.filter(ep => ep.value !== 'custom').map((endpoint) => (
              <div key={endpoint.value} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-1 bg-blue-100 rounded">
                  <Code className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{endpoint.label}</p>
                  <p className="text-xs text-gray-500 font-mono">{endpoint.method} {endpoint.endpoint}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedEndpoint(endpoint.value)
                    runApiTest(endpoint.endpoint, endpoint.method)
                  }}
                >
                  <Play className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Statistics</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{testResults.length}</p>
              <p className="text-sm text-gray-500">Total Tests</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {testResults.filter(r => r.status === 'success').length}
              </p>
              <p className="text-sm text-gray-500">Successful</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {testResults.filter(r => r.status === 'error').length}
              </p>
              <p className="text-sm text-gray-500">Failed</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">
                {testResults.length > 0 
                  ? Math.round(testResults.reduce((sum, r) => sum + (r.duration || 0), 0) / testResults.length)
                  : 0
                }ms
              </p>
              <p className="text-sm text-gray-500">Avg Response</p>
            </div>
          </div>
        </div>
      </Card>
    </main>
    </>
  )
}

export default ApiTester
