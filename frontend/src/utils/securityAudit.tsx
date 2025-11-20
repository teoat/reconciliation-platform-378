import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// SECURITY AUDIT UTILITIES
// ============================================================================

interface SecurityAuditResult {
  category: string;
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  recommendation?: string;
}

interface SecurityAuditReport {
  timestamp: Date;
  overallScore: number;
  results: SecurityAuditResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

/**
 * Performs comprehensive security audit
 */
export async function performSecurityAudit(): Promise<SecurityAuditReport> {
  const results: SecurityAuditResult[] = [];
  let totalScore = 0;
  let maxScore = 0;

  // 1. Check for HTTPS
  const httpsCheck = checkHTTPS();
  results.push(httpsCheck);
  totalScore += httpsCheck.status === 'pass' ? 10 : 0;
  maxScore += 10;

  // 2. Check Content Security Policy
  const cspCheck = checkCSP();
  results.push(cspCheck);
  totalScore += cspCheck.status === 'pass' ? 15 : 0;
  maxScore += 15;

  // 3. Check security headers
  const headersCheck = await checkSecurityHeaders();
  results.push(...headersCheck);
  totalScore += headersCheck.filter((r) => r.status === 'pass').length * 5;
  maxScore += headersCheck.length * 5;

  // 4. Check for sensitive data exposure
  const sensitiveDataCheck = checkSensitiveDataExposure();
  results.push(...sensitiveDataCheck);
  totalScore += sensitiveDataCheck.filter((r) => r.status === 'pass').length * 8;
  maxScore += sensitiveDataCheck.length * 8;

  // 5. Check authentication security
  const authCheck = checkAuthenticationSecurity();
  results.push(...authCheck);
  totalScore += authCheck.filter((r) => r.status === 'pass').length * 10;
  maxScore += authCheck.length * 10;

  // 6. Check input validation
  const inputValidationCheck = checkInputValidation();
  results.push(...inputValidationCheck);
  totalScore += inputValidationCheck.filter((r) => r.status === 'pass').length * 7;
  maxScore += inputValidationCheck.length * 7;

  // 7. Check for XSS vulnerabilities
  const xssCheck = checkXSSVulnerabilities();
  results.push(...xssCheck);
  totalScore += xssCheck.filter((r) => r.status === 'pass').length * 12;
  maxScore += xssCheck.length * 12;

  // 8. Check for CSRF protection
  const csrfCheck = checkCSRFProtection();
  results.push(csrfCheck);
  totalScore += csrfCheck.status === 'pass' ? 10 : 0;
  maxScore += 10;

  // 9. Check for insecure dependencies
  const dependenciesCheck = await checkInsecureDependencies();
  results.push(...dependenciesCheck);
  totalScore += dependenciesCheck.filter((r) => r.status === 'pass').length * 6;
  maxScore += dependenciesCheck.length * 6;

  // 10. Check for data encryption
  const encryptionCheck = checkDataEncryption();
  results.push(...encryptionCheck);
  totalScore += encryptionCheck.filter((r) => r.status === 'pass').length * 9;
  maxScore += encryptionCheck.length * 9;

  const summary = {
    total: results.length,
    passed: results.filter((r) => r.status === 'pass').length,
    failed: results.filter((r) => r.status === 'fail').length,
    warnings: results.filter((r) => r.status === 'warning').length,
  };

  const overallScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  return {
    timestamp: new Date(),
    overallScore,
    results,
    summary,
  };
}

/**
 * Checks if the site is served over HTTPS
 */
function checkHTTPS(): SecurityAuditResult {
  const isHTTPS = window.location.protocol === 'https:';

  return {
    category: 'Transport Security',
    check: 'HTTPS Usage',
    status: isHTTPS ? 'pass' : 'fail',
    message: isHTTPS ? 'Site is served over HTTPS' : 'Site is not served over HTTPS',
    recommendation: isHTTPS ? undefined : 'Enable HTTPS for secure data transmission',
  };
}

/**
 * Checks Content Security Policy implementation
 */
function checkCSP(): SecurityAuditResult {
  const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
  const hasCSP = metaTags.length > 0;

  return {
    category: 'Content Security Policy',
    check: 'CSP Implementation',
    status: hasCSP ? 'pass' : 'fail',
    message: hasCSP
      ? 'Content Security Policy is implemented'
      : 'Content Security Policy is not implemented',
    recommendation: hasCSP ? undefined : 'Implement Content Security Policy to prevent XSS attacks',
  };
}

/**
 * Checks security headers
 */
async function checkSecurityHeaders(): Promise<SecurityAuditResult[]> {
  const results: SecurityAuditResult[] = [];

  try {
    const response = await fetch(window.location.href, { method: 'HEAD' });
    const headers = response.headers;

    const requiredHeaders = [
      'X-Frame-Options',
      'X-Content-Type-Options',
      'X-XSS-Protection',
      'Referrer-Policy',
      'Strict-Transport-Security',
    ];

    requiredHeaders.forEach((header) => {
      const hasHeader = headers.has(header);
      results.push({
        category: 'Security Headers',
        check: header,
        status: hasHeader ? 'pass' : 'fail',
        message: hasHeader ? `${header} header is present` : `${header} header is missing`,
        recommendation: hasHeader ? undefined : `Add ${header} header for enhanced security`,
      });
    });
  } catch (error) {
    results.push({
      category: 'Security Headers',
      check: 'Header Validation',
      status: 'warning',
      message: 'Could not validate security headers',
      recommendation: 'Manually verify security headers are properly configured',
    });
  }

  return results;
}

/**
 * Checks for sensitive data exposure
 */
function checkSensitiveDataExposure(): SecurityAuditResult[] {
  const results: SecurityAuditResult[] = [];

  // Check for sensitive data in localStorage
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
  const localStorageKeys = Object.keys(localStorage);
  const hasSensitiveData = localStorageKeys.some((key) =>
    sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))
  );

  results.push({
    category: 'Data Protection',
    check: 'Sensitive Data in localStorage',
    status: hasSensitiveData ? 'fail' : 'pass',
    message: hasSensitiveData
      ? 'Sensitive data found in localStorage'
      : 'No sensitive data in localStorage',
    recommendation: hasSensitiveData ? 'Remove sensitive data from localStorage' : undefined,
  });

  // Check for sensitive data in sessionStorage
  const sessionStorageKeys = Object.keys(sessionStorage);
  const hasSensitiveSessionData = sessionStorageKeys.some((key) =>
    sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))
  );

  results.push({
    category: 'Data Protection',
    check: 'Sensitive Data in sessionStorage',
    status: hasSensitiveSessionData ? 'fail' : 'pass',
    message: hasSensitiveSessionData
      ? 'Sensitive data found in sessionStorage'
      : 'No sensitive data in sessionStorage',
    recommendation: hasSensitiveSessionData
      ? 'Remove sensitive data from sessionStorage'
      : undefined,
  });

  return results;
}

/**
 * Checks authentication security
 */
function checkAuthenticationSecurity(): SecurityAuditResult[] {
  const results: SecurityAuditResult[] = [];

  // Check for secure token storage
  const token = localStorage.getItem('authToken');
  const hasSecureToken = token && token.length > 20;

  results.push({
    category: 'Authentication',
    check: 'Secure Token Storage',
    status: hasSecureToken ? 'pass' : 'warning',
    message: hasSecureToken
      ? 'Token appears to be securely stored'
      : 'Token storage may not be secure',
    recommendation: hasSecureToken
      ? undefined
      : 'Ensure tokens are properly secured and have sufficient entropy',
  });

  // Check for token expiration
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp && payload.exp < now;
      const expiresSoon = payload.exp && payload.exp - now < 3600; // 1 hour

      results.push({
        category: 'Authentication',
        check: 'Token Expiration',
        status: isExpired ? 'fail' : expiresSoon ? 'warning' : 'pass',
        message: isExpired
          ? 'Token is expired'
          : expiresSoon
            ? 'Token expires soon'
            : 'Token is valid',
        recommendation: isExpired
          ? 'Refresh or re-authenticate'
          : expiresSoon
            ? 'Consider refreshing token'
            : undefined,
      });
    } catch (error) {
      results.push({
        category: 'Authentication',
        check: 'Token Validation',
        status: 'fail',
        message: 'Token format is invalid',
        recommendation: 'Ensure token is properly formatted JWT',
      });
    }
  }

  return results;
}

/**
 * Checks input validation
 */
function checkInputValidation(): SecurityAuditResult[] {
  const results: SecurityAuditResult[] = [];

  // Check for input sanitization
  const inputs = document.querySelectorAll('input, textarea');
  const hasInputValidation = Array.from(inputs).some((input) => {
    const htmlInput = input as HTMLInputElement;
    return htmlInput.required || htmlInput.pattern || htmlInput.minLength > 0;
  });

  results.push({
    category: 'Input Validation',
    check: 'Input Validation',
    status: hasInputValidation ? 'pass' : 'warning',
    message: hasInputValidation
      ? 'Input validation is implemented'
      : 'Input validation may be missing',
    recommendation: hasInputValidation
      ? undefined
      : 'Implement proper input validation and sanitization',
  });

  // Check for XSS prevention
  const scripts = document.querySelectorAll('script');
  const hasInlineScripts = Array.from(scripts).some((script) => script.innerHTML.trim() !== '');

  results.push({
    category: 'Input Validation',
    check: 'XSS Prevention',
    status: hasInlineScripts ? 'warning' : 'pass',
    message: hasInlineScripts ? 'Inline scripts detected' : 'No inline scripts detected',
    recommendation: hasInlineScripts ? 'Avoid inline scripts to prevent XSS' : undefined,
  });

  return results;
}

/**
 * Checks for XSS vulnerabilities
 */
function checkXSSVulnerabilities(): SecurityAuditResult[] {
  const results: SecurityAuditResult[] = [];

  // Check for dangerous innerHTML usage
  const elements = document.querySelectorAll('*');
  const hasDangerousInnerHTML = Array.from(elements).some((element) => {
    const htmlElement = element as HTMLElement;
    return (
      htmlElement.innerHTML.includes('<script') || htmlElement.innerHTML.includes('javascript:')
    );
  });

  results.push({
    category: 'XSS Prevention',
    check: 'Dangerous innerHTML Usage',
    status: hasDangerousInnerHTML ? 'fail' : 'pass',
    message: hasDangerousInnerHTML
      ? 'Dangerous innerHTML usage detected'
      : 'No dangerous innerHTML usage',
    recommendation: hasDangerousInnerHTML ? 'Avoid using innerHTML with user input' : undefined,
  });

  // Check for eval usage
  const hasEvalUsage = document.documentElement.innerHTML.includes('eval(');

  results.push({
    category: 'XSS Prevention',
    check: 'eval() Usage',
    status: hasEvalUsage ? 'fail' : 'pass',
    message: hasEvalUsage ? 'eval() usage detected' : 'No eval() usage detected',
    recommendation: hasEvalUsage
      ? 'Avoid using eval() as it can lead to XSS vulnerabilities'
      : undefined,
  });

  return results;
}

/**
 * Checks CSRF protection
 */
function checkCSRFProtection(): SecurityAuditResult {
  const forms = document.querySelectorAll('form');
  const hasCSRFToken = Array.from(forms).some((form) => {
    const inputs = form.querySelectorAll('input[type="hidden"]');
    return Array.from(inputs).some((input) => {
      const htmlInput = input as HTMLInputElement;
      return (
        htmlInput.name.toLowerCase().includes('csrf') ||
        htmlInput.name.toLowerCase().includes('token')
      );
    });
  });

  return {
    category: 'CSRF Protection',
    check: 'CSRF Token',
    status: hasCSRFToken ? 'pass' : 'warning',
    message: hasCSRFToken
      ? 'CSRF protection appears to be implemented'
      : 'CSRF protection may be missing',
    recommendation: hasCSRFToken ? undefined : 'Implement CSRF protection for forms',
  };
}

/**
 * Checks for insecure dependencies
 */
async function checkInsecureDependencies(): Promise<SecurityAuditResult[]> {
  const results: SecurityAuditResult[] = [];

  // This would typically check package.json for known vulnerabilities
  // For now, we'll do a basic check
  results.push({
    category: 'Dependencies',
    check: 'Dependency Security',
    status: 'warning',
    message: 'Dependency security check requires server-side validation',
    recommendation: 'Run npm audit to check for vulnerable dependencies',
  });

  return results;
}

/**
 * Checks data encryption
 */
function checkDataEncryption(): SecurityAuditResult[] {
  const results: SecurityAuditResult[] = [];

  // Check if sensitive data is encrypted
  const hasEncryption = typeof crypto !== 'undefined' && crypto.subtle;

  results.push({
    category: 'Data Encryption',
    check: 'Crypto API Availability',
    status: hasEncryption ? 'pass' : 'fail',
    message: hasEncryption ? 'Web Crypto API is available' : 'Web Crypto API is not available',
    recommendation: hasEncryption ? undefined : 'Ensure Web Crypto API is available for encryption',
  });

  return results;
}

// ============================================================================
// SECURITY AUDIT HOOK
// ============================================================================

/**
 * Hook for performing security audits
 */
export function useSecurityAudit() {
  const [auditReport, setAuditReport] = useState<SecurityAuditReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAudit = useCallback(async () => {
    try {
      setIsRunning(true);
      setError(null);
      const report = await performSecurityAudit();
      setAuditReport(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audit failed');
    } finally {
      setIsRunning(false);
    }
  }, []);

  const clearAudit = useCallback(() => {
    setAuditReport(null);
    setError(null);
  }, []);

  return {
    auditReport,
    isRunning,
    error,
    runAudit,
    clearAudit,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  performSecurityAudit,
  useSecurityAudit,
};
