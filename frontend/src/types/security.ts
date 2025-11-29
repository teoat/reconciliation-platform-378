// ============================================================================
// SECURITY TYPES
// ============================================================================

export interface SecurityPolicy {
    id: string;
    name: string;
    description: string;
    category: 'access' | 'data' | 'network' | 'compliance';
    rules: SecurityRule[];
    isActive: boolean;
    lastUpdated: string;
}

export interface SecurityRule {
    id: string;
    name: string;
    description: string;
    type: 'allow' | 'deny' | 'require';
    conditions: string[];
    actions: string[];
}

export interface ComplianceFramework {
    id: string;
    name: string;
    description: string;
    requirements: ComplianceRequirement[];
    status: 'compliant' | 'non-compliant' | 'partial';
    lastAudit: string;
    nextAudit: string;
}

export interface ComplianceRequirement {
    id: string;
    title: string;
    description: string;
    status: 'met' | 'not_met' | 'partial';
    evidence: string[];
    lastChecked: string;
}

export interface AuditLog {
    id: string;
    timestamp: string;
    userId: string;
    action: string;
    resource: string;
    result: 'success' | 'failure' | 'denied';
    ipAddress: string;
    userAgent: string;
    details: Record<string, unknown>;
}

export interface EncryptionConfig {
    id: string;
    name: string;
    algorithm: string;
    keySize: number;
    status: 'active' | 'inactive';
    lastRotated: string;
    nextRotation: string;
}

export interface SecurityStats {
    securityScore: number;
    complianceStatus: number;
    activePolicies: number;
    auditEvents24h: number;
}
