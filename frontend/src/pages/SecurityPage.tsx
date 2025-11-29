'use client'

import { useState, useEffect } from 'react'
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Key, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  FileText, 
  Settings,
  Activity,
  Users,
  Globe,
  Server,
  HardDrive,
  Network,
  Zap,
  BarChart3,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react'

interface SecurityPageProps {
  project?: Record<string, unknown>
}

// Security Interfaces
interface SecurityPolicy {
  id: string
  name: string
  description: string
  category: 'access' | 'data' | 'network' | 'compliance'
  rules: SecurityRule[]
  isActive: boolean
  lastUpdated: string
}

interface SecurityRule {
  id: string
  name: string
  description: string
  type: 'allow' | 'deny' | 'require'
  conditions: string[]
  actions: string[]
}

interface ComplianceFramework {
  id: string
  name: string
  description: string
  requirements: ComplianceRequirement[]
  status: 'compliant' | 'non-compliant' | 'partial'
  lastAudit: string
  nextAudit: string
}

interface ComplianceRequirement {
  id: string
  title: string
  description: string
  status: 'met' | 'not_met' | 'partial'
  evidence: string[]
  lastChecked: string
}

interface AuditLog {
  id: string
  timestamp: string
  userId: string
  action: string
  resource: string
  result: 'success' | 'failure' | 'denied'
  ipAddress: string
  userAgent: string
  details: Record<string, unknown>
}

interface EncryptionConfig {
  id: string
  name: string
  algorithm: string
  keySize: number
  status: 'active' | 'inactive'
  lastRotated: string
  nextRotation: string
}

const SecurityPage = ({ project }: SecurityPageProps = {}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'policies' | 'compliance' | 'audit' | 'encryption'>('overview')
  const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicy[]>([])
  const [complianceFrameworks, setComplianceFrameworks] = useState<ComplianceFramework[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [encryptionConfigs, setEncryptionConfigs] = useState<EncryptionConfig[]>([])
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [showComplianceModal, setShowComplianceModal] = useState(false)

  // Initialize sample data
  useEffect(() => {
    const policies: SecurityPolicy[] = [
      {
        id: 'policy-1',
        name: 'Data Access Control',
        description: 'Controls who can access reconciliation data and under what conditions',
        category: 'access',
        rules: [
          {
            id: 'rule-1',
            name: 'Role-based Access',
            description: 'Users can only access data based on their assigned roles',
            type: 'require',
            conditions: ['user.role in ["admin", "manager", "analyst"]'],
            actions: ['check_role_permissions', 'log_access_attempt']
          },
          {
            id: 'rule-2',
            name: 'Time-based Access',
            description: 'Restrict access during non-business hours',
            type: 'deny',
            conditions: ['time.hour < 8 OR time.hour > 18'],
            actions: ['block_access', 'send_notification']
          }
        ],
        isActive: true,
        lastUpdated: '2023-12-15T10:00:00Z'
      },
      {
        id: 'policy-2',
        name: 'Data Encryption Policy',
        description: 'Ensures all sensitive data is encrypted at rest and in transit',
        category: 'data',
        rules: [
          {
            id: 'rule-3',
            name: 'Encrypt Sensitive Data',
            description: 'All PII and financial data must be encrypted',
            type: 'require',
            conditions: ['data.contains_pii = true OR data.contains_financial = true'],
            actions: ['encrypt_data', 'log_encryption']
          }
        ],
        isActive: true,
        lastUpdated: '2023-12-14T15:30:00Z'
      }
    ]

    const frameworks: ComplianceFramework[] = [
      {
        id: 'framework-1',
        name: 'SOX Compliance',
        description: 'Sarbanes-Oxley Act compliance for financial reporting',
        requirements: [
          {
            id: 'req-1',
            title: 'Financial Data Integrity',
            description: 'Ensure financial data accuracy and completeness',
            status: 'met',
            evidence: ['audit_trail_enabled', 'data_validation_rules'],
            lastChecked: '2023-12-15T09:00:00Z'
          },
          {
            id: 'req-2',
            title: 'Access Controls',
            description: 'Implement proper access controls for financial systems',
            status: 'met',
            evidence: ['rbac_implemented', 'audit_logging'],
            lastChecked: '2023-12-15T09:00:00Z'
          },
          {
            id: 'req-3',
            title: 'Data Retention',
            description: 'Maintain financial records for required periods',
            status: 'partial',
            evidence: ['retention_policy_exists'],
            lastChecked: '2023-12-15T09:00:00Z'
          }
        ],
        status: 'partial',
        lastAudit: '2023-12-01T00:00:00Z',
        nextAudit: '2024-03-01T00:00:00Z'
      },
      {
        id: 'framework-2',
        name: 'GDPR Compliance',
        description: 'General Data Protection Regulation compliance',
        requirements: [
          {
            id: 'req-4',
            title: 'Data Minimization',
            description: 'Collect only necessary personal data',
            status: 'met',
            evidence: ['data_collection_audit'],
            lastChecked: '2023-12-14T14:00:00Z'
          },
          {
            id: 'req-5',
            title: 'Right to Erasure',
            description: 'Provide data deletion capabilities',
            status: 'not_met',
            evidence: [],
            lastChecked: '2023-12-14T14:00:00Z'
          }
        ],
        status: 'non-compliant',
        lastAudit: '2023-11-15T00:00:00Z',
        nextAudit: '2024-02-15T00:00:00Z'
      }
    ]

    const logs: AuditLog[] = [
      {
        id: 'log-1',
        timestamp: '2023-12-15T14:30:00Z',
        userId: 'user-1',
        action: 'login',
        resource: 'system',
        result: 'success',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        details: { method: 'password', mfa: true }
      },
      {
        id: 'log-2',
        timestamp: '2023-12-15T14:25:00Z',
        userId: 'user-2',
        action: 'access_data',
        resource: 'reconciliation_data',
        result: 'denied',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        details: { reason: 'insufficient_permissions', data_type: 'financial' }
      },
      {
        id: 'log-3',
        timestamp: '2023-12-15T14:20:00Z',
        userId: 'user-3',
        action: 'export_data',
        resource: 'discrepancy_report',
        result: 'success',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        details: { format: 'csv', records: 150 }
      }
    ]

    const encryption: EncryptionConfig[] = [
      {
        id: 'enc-1',
        name: 'Database Encryption',
        algorithm: 'AES-256',
        keySize: 256,
        status: 'active',
        lastRotated: '2023-12-01T00:00:00Z',
        nextRotation: '2024-03-01T00:00:00Z'
      },
      {
        id: 'enc-2',
        name: 'API Communication',
        algorithm: 'TLS 1.3',
        keySize: 256,
        status: 'active',
        lastRotated: '2023-11-15T00:00:00Z',
        nextRotation: '2024-02-15T00:00:00Z'
      },
      {
        id: 'enc-3',
        name: 'File Storage',
        algorithm: 'AES-256-GCM',
        keySize: 256,
        status: 'active',
        lastRotated: '2023-12-10T00:00:00Z',
        nextRotation: '2024-01-10T00:00:00Z'
      }
    ]

    setSecurityPolicies(policies)
    setComplianceFrameworks(frameworks)
    setAuditLogs(logs)
    setEncryptionConfigs(encryption)
  }, [])

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-100'
      case 'partial': return 'text-yellow-600 bg-yellow-100'
      case 'non-compliant': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRequirementStatusColor = (status: string) => {
    switch (status) {
      case 'met': return 'text-green-600'
      case 'partial': return 'text-yellow-600'
      case 'not_met': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          Security & Compliance
        </h1>
        <p className="text-secondary-600">
          Manage security policies, compliance frameworks, and audit trails
        </p>
        {project && (
          <div className="mt-2 text-sm text-primary-600">
            Project: {project.name}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-2 inline" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'policies'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Shield className="w-4 h-4 mr-2 inline" />
            Security Policies
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'compliance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="w-4 h-4 mr-2 inline" />
            Compliance
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'audit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Activity className="w-4 h-4 mr-2 inline" />
            Audit Logs
          </button>
          <button
            onClick={() => setActiveTab('encryption')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'encryption'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Lock className="w-4 h-4 mr-2 inline" />
            Encryption
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Security Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Security Score</p>
                  <p className="text-2xl font-bold text-green-600">94%</p>
                </div>
                <Shield className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Compliance Status</p>
                  <p className="text-2xl font-bold text-yellow-600">75%</p>
                </div>
                <FileText className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Active Policies</p>
                  <p className="text-2xl font-bold text-blue-600">{securityPolicies.filter(p => p.isActive).length}</p>
                </div>
                <Settings className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Audit Events (24h)</p>
                  <p className="text-2xl font-bold text-purple-600">{auditLogs.length}</p>
                </div>
                <Activity className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Recent Security Events */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Recent Security Events</h3>
            <div className="space-y-3">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      log.result === 'success' ? 'bg-green-500' :
                      log.result === 'denied' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{log.action}</p>
                      <p className="text-sm text-gray-600">{log.resource} • {log.userId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{new Date(log.timestamp).toLocaleTimeString()}</p>
                    <p className="text-xs text-gray-500">{log.ipAddress}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Status */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Compliance Status</h3>
            <div className="space-y-4">
              {complianceFrameworks.map((framework) => (
                <div key={framework.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{framework.name}</h4>
                      <p className="text-sm text-gray-600">{framework.description}</p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getComplianceStatusColor(framework.status)}`}>
                      {framework.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Requirements:</span>
                      <span className="ml-2 text-gray-600">{framework.requirements.length}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Last Audit:</span>
                      <span className="ml-2 text-gray-600">{new Date(framework.lastAudit).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Next Audit:</span>
                      <span className="ml-2 text-gray-600">{new Date(framework.nextAudit).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Security Policies Tab */}
      {activeTab === 'policies' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">Security Policies</h3>
              <button
                onClick={() => setShowPolicyModal(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Shield className="w-4 h-4" />
                <span>Create Policy</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {securityPolicies.map((policy) => (
                <div key={policy.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{policy.name}</h4>
                      <p className="text-sm text-gray-600">{policy.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        policy.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {policy.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {policy.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-700">Rules:</h5>
                    {policy.rules.map((rule) => (
                      <div key={rule.id} className="ml-4 p-2 bg-gray-50 rounded">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{rule.name}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            rule.type === 'allow' ? 'bg-green-100 text-green-800' :
                            rule.type === 'deny' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {rule.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">Compliance Frameworks</h3>
              <button
                onClick={() => setShowComplianceModal(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Add Framework</span>
              </button>
            </div>
            
            <div className="space-y-6">
              {complianceFrameworks.map((framework) => (
                <div key={framework.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{framework.name}</h4>
                      <p className="text-sm text-gray-600">{framework.description}</p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getComplianceStatusColor(framework.status)}`}>
                      {framework.status}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <h5 className="font-medium text-gray-700">Requirements:</h5>
                    {framework.requirements.map((req) => (
                      <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h6 className="font-medium text-gray-900">{req.title}</h6>
                          <p className="text-sm text-gray-600">{req.description}</p>
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">Evidence: </span>
                            {req.evidence.map((evidence, index) => (
                              <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1">
                                {evidence}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            req.status === 'met' ? 'bg-green-100 text-green-800' :
                            req.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {req.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(req.lastChecked).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">Audit Logs</h3>
              <div className="flex space-x-2">
                <button className="btn-secondary flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
                <button className="btn-secondary flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Timestamp</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Resource</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Result</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{log.userId}</td>
                      <td className="py-3 px-4 text-gray-600">{log.action}</td>
                      <td className="py-3 px-4 text-gray-600">{log.resource}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          log.result === 'success' ? 'bg-green-100 text-green-800' :
                          log.result === 'denied' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {log.result}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Encryption Tab */}
      {activeTab === 'encryption' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">Encryption Configuration</h3>
              <button className="btn-primary flex items-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>Add Encryption</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {encryptionConfigs.map((config) => (
                <div key={config.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{config.name}</h4>
                      <p className="text-sm text-gray-600">{config.algorithm} • {config.keySize} bits</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        config.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {config.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Last Rotated:</span>
                      <span className="ml-2 text-gray-600">{new Date(config.lastRotated).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Next Rotation:</span>
                      <span className="ml-2 text-gray-600">{new Date(config.nextRotation).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SecurityPage



