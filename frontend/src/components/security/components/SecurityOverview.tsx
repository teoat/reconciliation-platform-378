/**
 * Security Overview Component
 */

import { Shield, Users, Activity, CheckCircle } from 'lucide-react';
import type { SecurityPolicy, AccessControl, AuditLog, ComplianceReport } from '../types';

interface SecurityOverviewProps {
  policies: SecurityPolicy[];
  accessControls: AccessControl[];
  auditLogs: AuditLog[];
  complianceReports: ComplianceReport[];
}

export const SecurityOverview = ({
  policies,
  accessControls,
  auditLogs,
  complianceReports,
}: SecurityOverviewProps) => {
  const avgComplianceScore = Math.round(
    complianceReports.length > 0
      ? complianceReports.reduce((sum, r) => sum + r.score, 0) / complianceReports.length
      : 0
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-secondary-600">Active Policies</p>
            <p className="text-2xl font-bold text-secondary-900">
              {policies.filter((p) => p.status === 'active').length}
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
            <p className="text-2xl font-bold text-secondary-900">{avgComplianceScore}%</p>
          </div>
          <CheckCircle className="w-8 h-8 text-orange-600" />
        </div>
      </div>
    </div>
  );
};

