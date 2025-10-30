'use client'

import { useState, useEffect } from 'react'
import {
  Workflow,
  CheckCircle,
  XCircle,
  User,
  Settings,
  Edit,
  Eye,
  Bell,
  Zap,
  Shield,
  Activity,
  X,
  Plus,
} from 'lucide-react'
import { useData } from './DataProvider'
import { Project } from '../types'

// Workflow-related type definitions
interface WorkflowCondition {
  id: string
  field: string
  operator: 'greater_than' | 'less_than' | 'equals' | 'contains'
  value: string | number | boolean | Date
  logicalOperator?: 'AND' | 'OR'
}

interface WorkflowAction {
  id: string
  type: 'notify' | 'assign' | 'escalate' | 'create_task' | 'update_field'
  parameters: Record<string, any>
  order: number
}

interface WorkflowData {
  id: string
  name: string
  type: 'approve' | 'escalation' | 'validation' | 'automation'
  description: string
  assigneeGroup?: string
  conditions: WorkflowCondition[]
  actions: WorkflowAction[]
  timeout?: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'active' | 'inactive'
  order: number
}

interface BusinessRuleData {
  id: string
  name: string
  description: string
  category: 'validation' | 'routing' | 'calculation'
  conditions: WorkflowCondition[]
  actions: WorkflowAction[]
  priority: number
  status: 'pending' | 'active' | 'inactive'
  createdAt: string | Date
  updatedAt: string | Date
  createdBy: string
  executionCount: number
  successRate: number
  lastExecuted?: string | Date
}

interface WorkflowInstanceData {
  id: string
  workflowId: string
  recordId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  currentStep?: string
  steps: Array<{
    id: string
    stepId: string
    status: 'pending' | 'in_progress' | 'completed' | 'failed'
    startedAt?: string | Date
    assignedTo?: string
  }>
  startedAt?: string | Date
  assignedTo?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata: Record<string, any>
}

interface ApprovalRequestData {
  id: string
  workflowInstanceId: string
  stepId: string
  recordId: string
  requestedBy: string
  requestedAt: string | Date
  assignedTo: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  dueDate?: Date
  metadata: Record<string, any>
}

type TabId = 'workflows' | 'instances' | 'rules' | 'approvals'

interface WorkflowAutomationProps {
  project: Project | null
  onProgressUpdate?: (step: string) => void
}

const WorkflowAutomation = ({ project, onProgressUpdate }: WorkflowAutomationProps) => {
  const { currentProject } = useData()
  const [workflows, setWorkflows] = useState<WorkflowData[]>([])
  const [workflowInstances, setWorkflowInstances] = useState<WorkflowInstanceData[]>([])
  const [businessRules, setBusinessRules] = useState<BusinessRuleData[]>([])
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequestData[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowData | null>(null)
  const [showWorkflowModal, setShowWorkflowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('workflows')
  const [isCreating, setIsCreating] = useState(false)

  // Initialize workflow automation
  useEffect(() => {
    initializeWorkflowAutomation()
    onProgressUpdate?.('workflow_automation_started')
   }, [currentProject, onProgressUpdate])

  const initializeWorkflowAutomation = () => {
    // Initialize sample workflows
    const sampleWorkflows: WorkflowData[] = [
      {
        id: 'workflow-001',
        name: 'High Value Transaction Approval',
        type: 'approve',
        description: 'Multi-level approval workflow for transactions above 10M IDR',
        assigneeGroup: 'finance-team',
        conditions: [
          {
            id: 'cond-001',
            field: 'amount',
            operator: 'greater_than',
            value: 10000000
          }
        ],
        actions: [
          {
            id: 'action-001',
            type: 'notify',
            parameters: { recipients: ['finance-manager'], message: 'High value transaction requires approval' },
            order: 1
          },
          {
            id: 'action-002',
            type: 'assign',
            parameters: { assignee: 'finance-manager' },
            order: 2
          }
        ],
        timeout: 24,
        priority: 'high',
        status: 'pending',
        order: 1
      },
      {
        id: 'workflow-002',
        name: 'Discrepancy Escalation',
        type: 'escalation',
        description: 'Automatic escalation for discrepancies above threshold',
        assigneeGroup: 'reconciliation-team',
        conditions: [
          {
            id: 'cond-002',
            field: 'discrepancy_amount',
            operator: 'greater_than',
            value: 1000000
          }
        ],
        actions: [
          {
            id: 'action-003',
            type: 'escalate',
            parameters: { level: 'senior-analyst', reason: 'High discrepancy amount' },
            order: 1
          },
          {
            id: 'action-004',
            type: 'notify',
            parameters: { recipients: ['senior-analyst'], message: 'Discrepancy requires immediate attention' },
            order: 2
          }
        ],
        timeout: 4,
        priority: 'critical',
        status: 'pending',
        order: 2
      },
      {
        id: 'workflow-003',
        name: 'Data Quality Validation',
        type: 'validation',
        description: 'Automated validation for data quality issues',
        assigneeGroup: 'data-quality-team',
        conditions: [
          {
            id: 'cond-003',
            field: 'quality_score',
            operator: 'less_than',
            value: 90
          }
        ],
        actions: [
          {
            id: 'action-005',
            type: 'create_task',
            parameters: { taskType: 'data-cleanup', priority: 'medium' },
            order: 1
          },
          {
            id: 'action-006',
            type: 'notify',
            parameters: { recipients: ['data-quality-team'], message: 'Data quality issue detected' },
            order: 2
          }
        ],
        timeout: 8,
        priority: 'medium',
        status: 'pending',
        order: 3
      }
    ]

    // Initialize sample business rules
    const sampleRules: BusinessRuleData[] = [
      {
        id: 'rule-001',
        name: 'Amount Range Validation',
        description: 'Validate transaction amounts are within acceptable range',
        category: 'validation',
        conditions: [
          {
            id: 'rule-cond-001',
            field: 'amount',
            operator: 'greater_than',
            value: 0
          },
          {
            id: 'rule-cond-002',
            field: 'amount',
            operator: 'less_than',
            value: 100000000,
            logicalOperator: 'AND'
          }
        ],
        actions: [
          {
            id: 'rule-action-001',
            type: 'update_field',
            parameters: { field: 'validation_status', value: 'valid' },
            order: 1
          }
        ],
        priority: 1,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'system',
        executionCount: 1250,
        successRate: 98.5
      },
      {
        id: 'rule-002',
        name: 'Category Auto-Assignment',
        description: 'Automatically assign categories based on description keywords',
        category: 'routing',
        conditions: [
          {
            id: 'rule-cond-003',
            field: 'description',
            operator: 'contains',
            value: 'operasional'
          }
        ],
        actions: [
          {
            id: 'rule-action-002',
            type: 'update_field',
            parameters: { field: 'category', value: 'operational' },
            order: 1
          }
        ],
        priority: 2,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'system',
        executionCount: 890,
        successRate: 95.2
      }
    ]

    // Initialize sample workflow instances
    const sampleInstances: WorkflowInstanceData[] = [
      {
        id: 'instance-001',
        workflowId: 'workflow-001',
        recordId: 'REC-2023-001',
        status: 'running',
        currentStep: 'step-001',
        steps: [
          {
            id: 'step-instance-001',
            stepId: 'step-001',
            status: 'in_progress',
            startedAt: '2024-01-20T10:00:00Z',
            assignedTo: 'finance-manager'
          }
        ],
        startedAt: '2024-01-20T10:00:00Z',
        assignedTo: 'finance-manager',
        priority: 'high',
        metadata: { amount: 15000000, description: 'High value transaction' }
      }
    ]

    // Initialize sample approval requests
    const sampleApprovals: ApprovalRequestData[] = [
      {
        id: 'approval-001',
        workflowInstanceId: 'instance-001',
        stepId: 'step-001',
        recordId: 'REC-2023-001',
        requestedBy: 'system',
        requestedAt: '2024-01-20T10:00:00Z',
        assignedTo: 'finance-manager',
        status: 'pending',
        priority: 'high',
        dueDate: new Date('2024-01-21T10:00:00Z'),
        metadata: { amount: 15000000, description: 'High value transaction' }
      }
    ]

    setWorkflows(sampleWorkflows)
    setBusinessRules(sampleRules)
    setWorkflowInstances(sampleInstances)
    setApprovalRequests(sampleApprovals)
  }

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'running':
      case 'pending':
        return 'bg-green-100 text-green-800'
      case 'inactive':
      case 'completed':
      case 'approved':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'paused':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
      case 'skipped':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'approval':
        return <CheckCircle className="w-4 h-4" />
      case 'validation':
        return <Shield className="w-4 h-4" />
      case 'notification':
        return <Bell className="w-4 h-4" />
      case 'automation':
        return <Zap className="w-4 h-4" />
      case 'manual':
        return <User className="w-4 h-4" />
      default:
        return <Workflow className="w-4 h-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleCreateWorkflow = () => {
    setIsCreating(true)
    // Simulate workflow creation
    setTimeout(() => {
      const newWorkflow: WorkflowData = {
        id: `workflow-${Date.now()}`,
        name: 'New Workflow',
        type: 'approve',
        description: 'New workflow description',
        conditions: [],
        actions: [],
        priority: 'medium',
        status: 'pending',
        order: workflows.length + 1
      }
      setWorkflows(prev => [...prev, newWorkflow])
      setIsCreating(false)
    }, 1000)
  }

  const handleCreateRule = () => {
    setIsCreating(true)
    // Simulate rule creation
    setTimeout(() => {
      const newRule: BusinessRuleData = {
        id: `rule-${Date.now()}`,
        name: 'New Business Rule',
        description: 'New business rule description',
        category: 'validation',
        conditions: [],
        actions: [],
        priority: 1,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'current-user',
        executionCount: 0,
        successRate: 0
      }
      setBusinessRules(prev => [...prev, newRule])
      setIsCreating(false)
    }, 1000)
  }

  const handleApproveRequest = (requestId: string) => {
    setApprovalRequests(prev => prev.map(request => 
      request.id === requestId 
        ? { ...request, status: 'approved' as const }
        : request
    ))
  }

  const handleRejectRequest = (requestId: string) => {
    setApprovalRequests(prev => prev.map(request => 
      request.id === requestId 
        ? { ...request, status: 'rejected' as const }
        : request
    ))
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Workflow Automation
            </h1>
            <p className="text-secondary-600">
              Automated workflows, business rules, and approval processes
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCreateWorkflow}
              disabled={isCreating}
              className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>New Workflow</span>
            </button>
            <button
              onClick={handleCreateRule}
              disabled={isCreating}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <Settings className="w-4 h-4" />
              <span>New Rule</span>
            </button>
          </div>
        </div>
        
        {project && (
          <div className="text-sm text-primary-600 bg-primary-50 px-3 py-2 rounded-lg inline-block">
            Project: {project.name}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="card mb-6">
        <div className="border-b border-secondary-200">
          <nav className="flex space-x-8">
            {[
              { id: 'workflows', label: 'Workflows', icon: Workflow },
              { id: 'instances', label: 'Instances', icon: Activity },
              { id: 'rules', label: 'Business Rules', icon: Settings },
              { id: 'approvals', label: 'Approvals', icon: CheckCircle }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Workflows Tab */}
        {activeTab === 'workflows' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(workflow.type)}
                      <h3 className="font-semibold text-secondary-900">{workflow.name}</h3>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(workflow.status)}`}>
                      {workflow.status}
                    </span>
                  </div>
                  <p className="text-sm text-secondary-600 mb-3">{workflow.description || 'No description'}</p>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(workflow.priority)}`}>
                      {workflow.priority}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedWorkflow(workflow)
                          setShowWorkflowModal(true)
                        }}
                        className="text-secondary-400 hover:text-secondary-600"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-secondary-400 hover:text-secondary-600">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instances Tab */}
        {activeTab === 'instances' && (
          <div className="p-6">
            <div className="space-y-4">
              {workflowInstances.map((instance) => (
                <div key={instance.id} className="border border-secondary-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Activity className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-secondary-900">
                          {workflows.find(w => w.id === instance.workflowId)?.name || 'Unknown Workflow'}
                        </h3>
                        <p className="text-sm text-secondary-600">Record: {instance.recordId}</p>
                      </div>
                     <div className="flex items-center space-x-2">
                       <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(instance.status)}`}>
                         {instance.status}
                       </span>
                       <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(instance.priority)}`}>
                         {instance.priority}
                       </span>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                       <span className="text-secondary-600">Started:</span>
                       <span className="ml-2 text-secondary-900">
                         {instance.startedAt ? new Date(instance.startedAt).toLocaleString() : 'Not started'}
                       </span>
                     </div>
                     <div>
                       <span className="text-secondary-600">Assigned to:</span>
                       <span className="ml-2 text-secondary-900">{instance.assignedTo || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Current Step:</span>
                      <span className="ml-2 text-secondary-900">{instance.currentStep}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Business Rules Tab */}
        {activeTab === 'rules' && (
          <div className="p-6">
            <div className="space-y-4">
              {businessRules.map((rule) => (
                <div key={rule.id} className="border border-secondary-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Settings className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-secondary-900">{rule.name}</h3>
                        <p className="text-sm text-secondary-600">{rule.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                       <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(rule.status)}`}>
                         {rule.status}
                       </span>
                      <span className="text-xs text-secondary-500">
                        Priority: {rule.priority}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-secondary-600">Category:</span>
                      <span className="ml-2 text-secondary-900">{(rule as any).category}</span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Executions:</span>
                      <span className="ml-2 text-secondary-900">{(rule as any).executionCount}</span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Success Rate:</span>
                      <span className="ml-2 text-secondary-900">{rule.successRate.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Last Executed:</span>
                      <span className="ml-2 text-secondary-900">
                        {rule.lastExecuted ? new Date(rule.lastExecuted).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="p-6">
            <div className="space-y-4">
              {approvalRequests.map((request) => (
                <div key={request.id} className="border border-secondary-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-secondary-900">
                          Approval Request - {request.recordId}
                        </h3>
                        <p className="text-sm text-secondary-600">
                          Requested by: {request.requestedBy} • {new Date(request.requestedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(request.priority)}`}>
                        {request.priority}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-secondary-600">Assigned to:</span>
                      <span className="ml-2 text-secondary-900">{request.assignedTo}</span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Due Date:</span>
                      <span className="ml-2 text-secondary-900">
                        {request.dueDate ? new Date(request.dueDate).toLocaleString() : 'No due date'}
                      </span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Amount:</span>
                      <span className="ml-2 text-secondary-900">
                        {request.metadata.amount ? formatCurrency(request.metadata.amount) : 'N/A'}
                      </span>
                    </div>
                  </div>
                  {request.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproveRequest(request.id)}
                        className="btn-primary text-sm flex items-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        className="btn-secondary text-sm flex items-center space-x-2"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Workflow Detail Modal */}
      {showWorkflowModal && selectedWorkflow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-secondary-900">
                Workflow Details
              </h3>
              <button
                onClick={() => setShowWorkflowModal(false)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-secondary-900 mb-4">Workflow Information</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Name</span>
                    <span className="text-sm text-secondary-900">{selectedWorkflow.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Type</span>
                    <span className="text-sm text-secondary-900">{selectedWorkflow.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Priority</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedWorkflow.priority)}`}>
                      {selectedWorkflow.priority}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Status</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedWorkflow.status)}`}>
                      {selectedWorkflow.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Timeout</span>
                    <span className="text-sm text-secondary-900">{selectedWorkflow.timeout || 'N/A'} hours</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-secondary-900 mb-4">Description</h4>
                <p className="text-secondary-700">{selectedWorkflow.description}</p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-semibold text-secondary-900 mb-4">Conditions</h4>
              <div className="space-y-2">
                {selectedWorkflow.conditions.map((condition: WorkflowCondition) => (
                  <div key={condition.id} className="p-3 bg-secondary-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-secondary-900">{condition.field}</span>
                      <span className="text-sm text-secondary-600">{condition.operator}</span>
                       <span className="text-sm text-secondary-900">{String(condition.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-semibold text-secondary-900 mb-4">Actions</h4>
              <div className="space-y-2">
                {selectedWorkflow.actions.map((action: WorkflowAction) => (
                  <div key={action.id} className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-blue-900">{action.type}</span>
                      <span className="text-sm text-blue-700">
                        {JSON.stringify(action.parameters)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkflowAutomation



