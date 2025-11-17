# Content Security Policy (CSP) Monitoring

**Last Updated**: January 2025  
**Status**: Active

## Overview

This document describes how to monitor and handle Content Security Policy (CSP) violations in the Reconciliation Platform.

## CSP Configuration

### Current CSP Policy

The CSP is configured in:
- `frontend/src/services/security/csp.ts` - Dynamic CSP setup
- `frontend/src/utils/securityConfig.tsx` - CSP policy definitions

### Development CSP

```typescript
connect-src 'self' ws: wss: http://localhost:* https://localhost:* http://localhost:8200 ws://localhost:8200
```

### Production CSP

Uses nonce-based CSP for enhanced security. See `securityConfig.tsx` for details.

## Monitoring CSP Violations

### Browser Console

CSP violations are automatically logged to the browser console:

```
Refused to connect to 'http://localhost:8200/intake/v2/rum/events' because it violates the following Content Security Policy directive
```

### Programmatic Monitoring

The `CSPManager` class automatically monitors violations:

```typescript
import { CSPManager } from '@/services/security/csp';

const cspManager = new CSPManager(logSecurityEvent, generateId);
cspManager.setupCSP();

// Get violations
const violations = cspManager.getCSPViolations();
```

### Security Event Logging

CSP violations are automatically logged as security events:

```typescript
{
  type: 'SUSPICIOUS_ACTIVITY',
  severity: 'MEDIUM',
  description: 'CSP violation detected',
  metadata: {
    blockedURI: 'http://localhost:8200/intake/v2/rum/events',
    violatedDirective: 'connect-src',
    originalPolicy: '...',
    timestamp: '2025-01-17T00:00:00.000Z'
  }
}
```

## Common CSP Violations

### 1. APM Monitoring Endpoint

**Issue**: `http://localhost:8200` blocked by CSP

**Solution**: Already configured in development CSP:
```typescript
"connect-src 'self' ws: wss: http://localhost:* https://localhost:* http://localhost:8200 ws://localhost:8200"
```

**Status**: ✅ Fixed

### 2. WebSocket Connections

**Issue**: WebSocket connections blocked

**Solution**: Use `ws:` and `wss:` wildcards or specific endpoints:
```typescript
"connect-src 'self' ws: wss: ws://localhost:2000"
```

### 3. External Scripts

**Issue**: External scripts blocked

**Solution**: Add to `script-src` or use nonces:
```typescript
"script-src 'self' 'nonce-{nonce}' https://trusted-cdn.com"
```

### 4. Inline Styles

**Issue**: Inline styles blocked

**Solution**: Use nonces or allow unsafe-inline (development only):
```typescript
"style-src 'self' 'nonce-{nonce}' https://fonts.googleapis.com"
```

## Monitoring in Production

### 1. Server-Side Logging

Set up server-side logging for CSP violations:

```typescript
// In backend middleware
app.use((req, res, next) => {
  const cspReport = req.body['csp-report'];
  if (cspReport) {
    logger.warn('CSP Violation', {
      blockedURI: cspReport['blocked-uri'],
      violatedDirective: cspReport['violated-directive'],
      documentURI: cspReport['document-uri'],
    });
  }
  next();
});
```

### 2. CSP Report-Only Mode

Use `Content-Security-Policy-Report-Only` header for testing:

```typescript
meta.httpEquiv = 'Content-Security-Policy-Report-Only';
```

### 3. Reporting Endpoint

Configure CSP reporting endpoint:

```typescript
"report-uri /api/csp-report"
```

## Debugging CSP Issues

### 1. Check Browser Console

Open browser DevTools → Console to see CSP violations.

### 2. Verify CSP Header

Check the actual CSP header in Network tab:
1. Open DevTools → Network
2. Reload page
3. Check response headers for `Content-Security-Policy`

### 3. Use CSP Evaluator

Use [CSP Evaluator](https://csp-evaluator.withgoogle.com/) to validate CSP policies.

### 4. Test in Different Environments

Test CSP in:
- Development (more permissive)
- Production (strict with nonces)

## Fixing CSP Violations

### Step 1: Identify the Violation

Check browser console for:
- Blocked URI
- Violated directive
- Source of violation

### Step 2: Determine if Legitimate

- **Legitimate**: Add to CSP policy
- **Malicious**: Keep blocked, investigate source

### Step 3: Update CSP Policy

Update CSP in `csp.ts` or `securityConfig.tsx`:

```typescript
// Add to appropriate directive
'connect-src': [
  "'self'",
  'https://api.example.com', // Add new endpoint
],
```

### Step 4: Test Fix

1. Clear browser cache
2. Reload page
3. Verify violation is resolved
4. Check console for new violations

## Best Practices

### 1. Use Nonces in Production

Always use nonces for inline scripts/styles in production:

```typescript
"script-src 'self' 'nonce-{nonce}'"
```

### 2. Avoid unsafe-inline

Never use `'unsafe-inline'` in production:

```typescript
// ❌ DON'T: In production
"script-src 'self' 'unsafe-inline'"

// ✅ DO: Use nonces
"script-src 'self' 'nonce-{nonce}'"
```

### 3. Whitelist Specific Domains

Avoid wildcards, whitelist specific domains:

```typescript
// ❌ DON'T: Too permissive
"connect-src *"

// ✅ DO: Specific domains
"connect-src 'self' https://api.example.com"
```

### 4. Monitor Regularly

Set up alerts for CSP violations:
- High frequency violations
- New violation patterns
- Security-related violations

## Automated Testing

### Playwright Tests

CSP violations are detected in Playwright tests:

```typescript
test('No CSP violations', async ({ page }) => {
  const violations = [];
  page.on('console', msg => {
    if (msg.text().includes('Content Security Policy')) {
      violations.push(msg.text());
    }
  });
  
  await page.goto('/');
  expect(violations.length).toBe(0);
});
```

## Troubleshooting

### Issue: CSP not applied

**Check**:
1. CSP meta tag exists in `<head>`
2. CSPManager.setupCSP() is called
3. No conflicting CSP headers from server

### Issue: Violations still occurring after fix

**Check**:
1. Browser cache cleared
2. CSP updated in correct file
3. Development vs production CSP

### Issue: Too many violations

**Check**:
1. CSP too strict
2. Third-party scripts not whitelisted
3. Development tools interfering

## Related Documentation

- [Security Guidelines](.cursor/rules/security.mdc)
- [Frontend Diagnostic Fixes](../FRONTEND_DIAGNOSTIC_FIXES.md)
- [CSP Configuration](../src/utils/securityConfig.tsx)

