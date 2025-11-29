import { PageMetadata, PageContext, WorkflowState, GuidanceContent } from '../types';

export const securityPageMetadata: PageMetadata = {
    id: 'security',
    title: 'Security & Compliance',
    description: 'Manage security policies, compliance frameworks, and audit trails',
    route: '/security',
    requiredPermissions: ['admin', 'security_manager'],
};

export const getSecurityPageContext = (
    projectId?: string,
    securityScore?: number,
    complianceStatus?: number,
    activePolicies?: number
): PageContext => ({
    pageId: 'security',
    projectId,
    data: {
        securityScore,
        complianceStatus,
        activePolicies,
    },
    timestamp: new Date().toISOString(),
});

export const getSecurityWorkflowState = (
    securityScore: number,
    complianceStatus: number
): WorkflowState => {
    if (securityScore < 70 || complianceStatus < 70) {
        return 'needs_attention';
    }
    if (securityScore >= 90 && complianceStatus >= 90) {
        return 'optimized';
    }
    return 'active';
};

export const registerSecurityGuidanceHandlers = (
    onViewPolicy?: (policyId: string) => void,
    onViewCompliance?: (frameworkId: string) => void
) => {
    // Register handlers if needed
};

export const getSecurityGuidanceContent = (topic: string): GuidanceContent | null => {
    switch (topic) {
        case 'policies':
            return {
                title: 'Security Policies',
                content: 'Define and enforce access controls, data protection, and network security rules.',
                links: [{ title: 'Policy Best Practices', url: '#' }],
            };
        case 'compliance':
            return {
                title: 'Compliance Frameworks',
                content: 'Track adherence to regulatory standards like SOX, GDPR, and HIPAA.',
                links: [{ title: 'Compliance Guide', url: '#' }],
            };
        default:
            return null;
    }
};
