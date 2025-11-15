// Data Provider Security Hook
import { useSecurity } from '../../hooks/useSecurity';

export const useDataProviderSecurity = () => {
  const {
    securityPolicies,
    auditLogs,
    isSecurityEnabled,
    checkPermission,
    logAuditEvent,
    encryptData,
    decryptData,
    checkCompliance,
    createSecurityPolicy,
    updateSecurityPolicy,
    deleteSecurityPolicy,
    exportAuditLogs,
  } = useSecurity();

  return {
    securityPolicies,
    auditLogs,
    isSecurityEnabled,
    checkPermission,
    logAuditEvent,
    encryptData,
    decryptData,
    checkCompliance,
    createSecurityPolicy,
    updateSecurityPolicy,
    deleteSecurityPolicy,
    exportAuditLogs,
  };
};
