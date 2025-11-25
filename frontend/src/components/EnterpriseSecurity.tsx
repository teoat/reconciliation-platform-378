'use client';

import { useState, useEffect } from 'react'
import { 
  Shield, 
  Lock, 
  Eye, 
  User, 
  Users, 
  Settings, 
  CheckCircle,
  Activity,
  Download,
  Edit,
Plus as PlusIcon
} from 'lucide-react'
import { useData } from '../components/DataProvider'
import type { BackendProject } from '../services/apiClient/types'
import { formatTimeAgo } from '../utils/common/dateFormatting'

// Enterprise Security Interfaces
interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  category: 'access_control' | 'data_protection' | 'audit' | 'compliance' | 'encryption';
  rules: SecurityRule[];
  status: 'active' | 'inactive' | 'draft';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  lastReviewed: string;
  compliance: {
    gdpr: boolean;
    sox: boolean;
    pci: boolean;
    hipaa: boolean;
  };
}

interface SecurityRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: 'allow' | 'deny' | 'log' | 'alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

interface AccessControl {
  id: string;
  userId: string;
  userName: string;
  role: string;
  permissions: string[];
  resources: string[];
  expiresAt?: string;
  lastAccess: string;
  ipAddress: string;
  userAgent: string;
  status: 'active' | 'expired' | 'revoked';
}

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  result: 'success' | 'failure' | 'blocked';
  details: Record<string, unknown>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface ComplianceReport {
  id: string;
  name: string;
  framework: 'gdpr' | 'sox' | 'pci' | 'hipaa' | 'iso27001';
  status: 'compliant' | 'non_compliant' | 'partial' | 'pending';
  score: number;
  lastAssessment: string;
  nextAssessment: string;
  findings: ComplianceFinding[];
  recommendations: string[];
}

interface ComplianceFinding {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'accepted';
  dueDate: string;
  assignedTo: string;
  evidence: string[];
}

interface EnterpriseSecurityProps {
  project: BackendProject;
  onProgressUpdate?: (step: string) => void;
}

const EnterpriseSecurity = ({ project, onProgressUpdate }: EnterpriseSecurityProps) => {
  const { currentProject } = useData();
  const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicy[]>([]);
  const [accessControls, setAccessControls] = useState<AccessControl[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<SecurityPolicy | null>(null);
  const [selectedReport, setSelectedReport] = useState<ComplianceReport | null>(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'policies' | 'access' | 'audit' | 'compliance'>(
    'policies'
  );
  const [isCreating, setIsCreating] = useState(false);

  // Initialize enterprise security
  useEffect(() => {
    initializeEnterpriseSecurity();
    onProgressUpdate?.('enterprise_security_started');
  }, [currentProject, onProgressUpdate]);

  const initializeEnterpriseSecurity = () => {
    // Initialize sample security policies
    const samplePolicies: SecurityPolicy[] = [
      {
        id: 'policy-001',
        name: 'Data Access Control Policy',
        description: 'Controls access to sensitive reconciliation data',
        category: 'access_control',
        rules: [
          {
            id: 'rule-001',
            name: 'Role-based Access',
            description: 'Users can only access data based on their role',
            condition: 'user.role in ["admin", "manager", "analyst"]',
            action: 'allow',
            severity: 'high',
            enabled: true,
          },
          {
            id: 'rule-002',
            name: 'Time-based Access',
            description: 'Access restricted to business hours',
            condition: 'current_time.hour >= 8 AND current_time.hour <= 18',
            action: 'deny',
            severity: 'medium',
            enabled: true,
          },
        ],
        status: 'active',
        priority: 'high',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
        lastReviewed: '2024-01-15T00:00:00Z',
        compliance: {
          gdpr: true,
          sox: true,
          pci: false,
          hipaa: false,
        },
      },
      {
        id: 'policy-002',
        name: 'Data Encryption Policy',
        description: 'Ensures all sensitive data is encrypted',
        category: 'encryption',
        rules: [
          {
            id: 'rule-003',
            name: 'Encrypt at Rest',
            description: 'All data must be encrypted when stored',
            condition: 'data.sensitivity == "high"',
            action: 'allow',
            severity: 'critical',
            enabled: true,
          },
          {
            id: 'rule-004',
            name: 'Encrypt in Transit',
            description: 'All data transmission must use TLS',
            condition: 'protocol != "https"',
            action: 'deny',
            severity: 'critical',
            enabled: true,
          },
        ],
        status: 'active',
        priority: 'critical',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
        lastReviewed: '2024-01-10T00:00:00Z',
        compliance: {
          gdpr: true,
          sox: true,
          pci: true,
          hipaa: true,
        },
      },
    ];

    // Initialize sample access controls
    const sampleAccessControls: AccessControl[] = [
      {
        id: 'access-001',
        userId: 'user-001',
        userName: 'John Smith',
        role: 'admin',
        permissions: ['read', 'write', 'delete', 'admin'],
        resources: ['reconciliation', 'cashflow', 'analytics'],
        lastAccess: new Date(Date.now() - 300000).toISOString(),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        status: 'active',
      },
      {
        id: 'access-002',
        userId: 'user-002',
        userName: 'Sarah Johnson',
        role: 'manager',
        permissions: ['read', 'write', 'approve'],
        resources: ['reconciliation', 'cashflow'],
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        lastAccess: new Date(Date.now() - 600000).toISOString(),
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        status: 'active',
      },
    ];

    // Initialize sample audit logs
    const sampleAuditLogs: AuditLog[] = [
      {
        id: 'audit-001',
        userId: 'user-001',
        userName: 'John Smith',
        action: 'login',
        resource: 'system',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        result: 'success',
        details: { method: 'password', mfa: true },
        riskLevel: 'low',
      },
      {
        id: 'audit-002',
        userId: 'user-002',
        userName: 'Sarah Johnson',
        action: 'view_record',
        resource: 'reconciliation/REC-2023-001',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        result: 'success',
        details: { recordId: 'REC-2023-001', amount: 15000000 },
        riskLevel: 'low',
      },
      {
        id: 'audit-003',
        userId: 'user-003',
        userName: 'Mike Wilson',
        action: 'export_data',
        resource: 'reconciliation',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        ipAddress: '192.168.1.102',
        userAgent: 'curl/7.68.0',
        result: 'blocked',
        details: { reason: 'insufficient_permissions' },
        riskLevel: 'high',
      },
    ];

    // Initialize sample compliance reports
    const sampleComplianceReports: ComplianceReport[] = [
      {
        id: 'report-001',
        name: 'GDPR Compliance Assessment',
        framework: 'gdpr',
        status: 'compliant',
        score: 95,
        lastAssessment: '2024-01-15T00:00:00Z',
        nextAssessment: '2024-04-15T00:00:00Z',
        findings: [
          {
            id: 'finding-001',
            title: 'Data Processing Lawfulness',
            description: 'All data processing activities have legal basis',
            severity: 'low',
            status: 'resolved',
            dueDate: '2024-01-20T00:00:00Z',
            assignedTo: 'legal-team',
            evidence: ['data-processing-agreements.pdf', 'consent-records.csv'],
          },
        ],
        recommendations: [
          'Implement automated data retention policies',
          'Enhance user consent management',
          'Regular privacy impact assessments',
        ],
      },
      {
        id: 'report-002',
        name: 'SOX Compliance Review',
        framework: 'sox',
        status: 'partial',
        score: 78,
        lastAssessment: '2024-01-10T00:00:00Z',
        nextAssessment: '2024-07-10T00:00:00Z',
        findings: [
          {
            id: 'finding-002',
            title: 'Internal Controls Documentation',
            description: 'Some internal controls lack proper documentation',
            severity: 'medium',
            status: 'in_progress',
            dueDate: '2024-02-15T00:00:00Z',
            assignedTo: 'compliance-team',
            evidence: ['control-documentation.pdf'],
          },
        ],
        recommendations: [
          'Complete internal controls documentation',
          'Implement automated control testing',
          'Enhance audit trail completeness',
        ],
      },
    ];

    setSecurityPolicies(samplePolicies);
    setAccessControls(sampleAccessControls);
    setAuditLogs(sampleAuditLogs);
    setComplianceReports(sampleComplianceReports);
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'compliant':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'inactive':
      case 'non_compliant':
      case 'failure':
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'partial':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'access_control':
        return <User className="w-4 h-4" />;
      case 'data_protection':
        return <Shield className="w-4 h-4" />;
      case 'audit':
        return <Activity className="w-4 h-4" />;
      case 'compliance':
        return <CheckCircle className="w-4 h-4" />;
      case 'encryption':
        return <Lock className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getFrameworkColor = (framework: string) => {
    switch (framework) {
      case 'gdpr':
        return 'bg-blue-100 text-blue-800';
      case 'sox':
        return 'bg-green-100 text-green-800';
      case 'pci':
        return 'bg-purple-100 text-purple-800';
      case 'hipaa':
        return 'bg-orange-100 text-orange-800';
      case 'iso27001':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  const handleCreatePolicy = () => {
    setIsCreating(true);
    // Simulate policy creation
    setTimeout(() => {
      const newPolicy: SecurityPolicy = {
        id: `policy-${Date.now()}`,
        name: 'New Security Policy',
        description: 'New security policy description',
        category: 'access_control',
        rules: [],
        status: 'draft',
        priority: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastReviewed: new Date().toISOString(),
        compliance: {
          gdpr: false,
          sox: false,
          pci: false,
          hipaa: false,
        },
      };
      setSecurityPolicies((prev) => [...prev, newPolicy]);
      setIsCreating(false);
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Enterprise Security & Compliance
            </h1>
            <p className="text-secondary-600">
              Security policies, access controls, audit logs, and compliance management
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCreatePolicy}
              disabled={isCreating}
              className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
            >
              <PlusIcon className="w-4 h-4" />
              <span>New Policy</span>
            </button>
            <button className="btn-primary flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Security Scan</span>
            </button>
          </div>
        </div>

        {project && (
          <div className="text-sm text-primary-600 bg-primary-50 px-3 py-2 rounded-lg inline-block">
            Project: {project.name}
          </div>
        )}
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Active Policies</p>
              <p className="text-2xl font-bold text-secondary-900">
                {securityPolicies.filter((p) => p.status === 'active').length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Active Users</p>
              <p className="text-2xl font-bold text-secondary-900">
                {accessControls.filter((a) => a.status === 'active').length}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Audit Events</p>
              <p className="text-2xl font-bold text-secondary-900">
                {auditLogs.length.toLocaleString()}
              </p>
            </div>
            <Activity className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Compliance Score</p>
              <p className="text-2xl font-bold text-secondary-900">
                {Math.round(
                  complianceReports.reduce((sum, r) => sum + r.score, 0) / complianceReports.length
                )}
                %
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card mb-6">
        <div className="border-b border-secondary-200">
          <div className="flex space-x-8" role="tablist" aria-label="Security tabs">
            {(
              [
                { id: 'policies', label: 'Security Policies', icon: Shield },
                { id: 'access', label: 'Access Control', icon: User },
                { id: 'audit', label: 'Audit Logs', icon: Activity },
                { id: 'compliance', label: 'Compliance', icon: CheckCircle },
              ] as const
            ).map((tabItem) => {
              const TabIcon = tabItem.icon;
              return (
                <button
                  key={tabItem.id}
                  onClick={() => setActiveTab(tabItem.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tabItem.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                  role="tab"
                  aria-selected={activeTab === tabItem.id ? 'true' : 'false'}
                  aria-label={tabItem.label}
                  type="button"
                >
                  <TabIcon className="w-4 h-4" aria-hidden="true" />
                  <span>{tabItem.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Security Policies Tab */}
        {activeTab === 'policies' && (
          <div className="p-6">
            <div className="space-y-4">
              {securityPolicies.map((policy) => (
                <div
                  key={policy.id}
                  className="border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        {getCategoryIcon(policy.category)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-secondary-900">{policy.name}</h3>
                        <p className="text-sm text-secondary-600">{policy.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(policy.status)}`}
                      >
                        {policy.status}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(policy.priority)}`}
                      >
                        {policy.priority}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-secondary-600">Rules:</span>
                      <span className="ml-2 text-secondary-900">{policy.rules.length}</span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Last Reviewed:</span>
                      <span className="ml-2 text-secondary-900">
                        {new Date(policy.lastReviewed).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Compliance:</span>
                      <span className="ml-2 text-secondary-900">
                        {Object.values(policy.compliance).filter(Boolean).length}/4
                      </span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Category:</span>
                      <span className="ml-2 text-secondary-900 capitalize">
                        {policy.category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedPolicy(policy);
                        setShowPolicyModal(true);
                      }}
                      className="btn-secondary text-sm flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </button>
                    <button className="btn-primary text-sm flex-1">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit Policy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Access Control Tab */}
        {activeTab === 'access' && (
          <div className="p-6">
            <div className="space-y-4">
              {accessControls.map((access) => (
                <div
                  key={access.id}
                  className="border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-secondary-900">{access.userName}</h3>
                        <p className="text-sm text-secondary-600">{access.userId}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(access.status)}`}
                      >
                        {access.status}
                      </span>
                      <span className="text-xs text-secondary-500">{access.role}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-secondary-600">Last Access:</span>
                      <span className="ml-2 text-secondary-900">
                        {formatTimeAgo(access.lastAccess)}
                      </span>
                    </div>
                    <div>
                      <span className="text-secondary-600">IP Address:</span>
                      <span className="ml-2 text-secondary-900">{access.ipAddress}</span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Permissions:</span>
                      <span className="ml-2 text-secondary-900">{access.permissions.length}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button className="btn-secondary text-sm flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </button>
                    <button className="btn-primary text-sm flex-1">
                      <Settings className="w-4 h-4 mr-1" />
                      Manage Access
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <div className="p-6">
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 border border-secondary-200 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center">
                      <Activity className="w-4 h-4 text-secondary-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-secondary-900">{log.userName}</span>
                        <span className="text-sm text-secondary-600">{log.action}</span>
                        <span className="text-sm text-secondary-500">{log.resource}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-secondary-500 mt-1">
                        <span>{log.ipAddress}</span>
                        <span>{formatTimeAgo(log.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(log.result)}`}
                    >
                      {log.result}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(log.riskLevel)}`}
                    >
                      {log.riskLevel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === 'compliance' && (
          <div className="p-6">
            <div className="space-y-4">
              {complianceReports.map((report) => (
                <div
                  key={report.id}
                  className="border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-secondary-900">{report.name}</h3>
                        <p className="text-sm text-secondary-600">
                          {report.framework.toUpperCase()} Framework
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getFrameworkColor(report.framework)}`}
                      >
                        {report.framework.toUpperCase()}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}
                      >
                        {report.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-secondary-600">Score:</span>
                      <span className="ml-2 text-secondary-900">{report.score}%</span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Last Assessment:</span>
                      <span className="ml-2 text-secondary-900">
                        {new Date(report.lastAssessment).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Findings:</span>
                      <span className="ml-2 text-secondary-900">{report.findings.length}</span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Next Assessment:</span>
                      <span className="ml-2 text-secondary-900">
                        {new Date(report.nextAssessment).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setShowReportModal(true);
                      }}
                      className="btn-secondary text-sm flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Report
                    </button>
                    <button className="btn-primary text-sm flex-1">
                      <Download className="w-4 h-4 mr-1" />
                      Export Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnterpriseSecurity;
