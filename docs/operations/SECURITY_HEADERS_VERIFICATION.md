# Security Headers Verification Guide

**Last Updated**: 2025-11-29  
**Status**: ACTIVE  
**Purpose**: Guide for verifying security headers (CSP, HSTS, etc.)

---

## Overview

Security headers protect against various attacks including XSS, clickjacking, and protocol downgrade attacks.

---

## Required Security Headers

### Content Security Policy (CSP)

**Purpose**: Prevents XSS attacks by controlling which resources can be loaded

**Verification**:
```bash
# Check CSP header
curl -I https://api.example.com | grep -i "content-security-policy"

# Expected format:
# Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
```

**Configuration**: Set in `backend/src/middleware/security/headers.rs`

---

### HTTP Strict Transport Security (HSTS)

**Purpose**: Forces browsers to use HTTPS

**Verification**:
```bash
# Check HSTS header
curl -I https://api.example.com | grep -i "strict-transport-security"

# Expected format:
# Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**Configuration**: Set in `backend/src/middleware/security/headers.rs`

---

### X-Frame-Options

**Purpose**: Prevents clickjacking attacks

**Verification**:
```bash
# Check X-Frame-Options header
curl -I https://api.example.com | grep -i "x-frame-options"

# Expected values:
# X-Frame-Options: DENY
# X-Frame-Options: SAMEORIGIN
```

---

### X-Content-Type-Options

**Purpose**: Prevents MIME type sniffing

**Verification**:
```bash
# Check X-Content-Type-Options header
curl -I https://api.example.com | grep -i "x-content-type-options"

# Expected:
# X-Content-Type-Options: nosniff
```

---

### X-XSS-Protection

**Purpose**: Enables browser XSS filter (legacy, but still useful)

**Verification**:
```bash
# Check X-XSS-Protection header
curl -I https://api.example.com | grep -i "x-xss-protection"

# Expected:
# X-XSS-Protection: 1; mode=block
```

---

### Referrer-Policy

**Purpose**: Controls referrer information

**Verification**:
```bash
# Check Referrer-Policy header
curl -I https://api.example.com | grep -i "referrer-policy"

# Expected:
# Referrer-Policy: strict-origin-when-cross-origin
```

---

## Automated Verification

### Script: verify-security-headers.sh

```bash
#!/bin/bash
# Verify Security Headers

API_URL="${API_URL:-https://api.example.com}"

echo "Checking security headers for $API_URL..."

# Check all headers
HEADERS=(
    "Content-Security-Policy"
    "Strict-Transport-Security"
    "X-Frame-Options"
    "X-Content-Type-Options"
    "X-XSS-Protection"
    "Referrer-Policy"
)

for header in "${HEADERS[@]}"; do
    value=$(curl -sI "$API_URL" | grep -i "$header" | cut -d: -f2- | xargs)
    if [ -n "$value" ]; then
        echo "✅ $header: $value"
    else
        echo "❌ $header: Missing"
    fi
done
```

---

## Testing

### Manual Testing

1. **Browser DevTools**:
   - Open Network tab
   - Check Response Headers
   - Verify all security headers are present

2. **Online Tools**:
   - [SecurityHeaders.com](https://securityheaders.com)
   - [Mozilla Observatory](https://observatory.mozilla.org)

3. **Command Line**:
   ```bash
   curl -I https://api.example.com | grep -E "(CSP|HSTS|X-Frame|X-Content|X-XSS|Referrer)"
   ```

---

## Configuration

### Backend Configuration

Security headers are configured in:
- `backend/src/middleware/security/headers.rs`
- `backend/src/middleware/security/mod.rs`

### Frontend Configuration

For static assets, configure in:
- Web server (Nginx/Apache)
- CDN configuration
- Load balancer configuration

---

## Best Practices

1. **CSP**: Start restrictive, gradually relax as needed
2. **HSTS**: Use `max-age=31536000` (1 year) in production
3. **X-Frame-Options**: Use `DENY` unless iframes are needed
4. **Regular Audits**: Check headers monthly
5. **Testing**: Test after each deployment

---

## Troubleshooting

### Missing Headers

**Issue**: Headers not appearing in responses

**Solutions**:
1. Check middleware is registered in `main.rs`
2. Verify middleware order (security headers should be early)
3. Check for middleware conflicts
4. Verify production configuration

### CSP Violations

**Issue**: CSP blocking legitimate resources

**Solutions**:
1. Check browser console for violations
2. Review CSP report endpoint (`/api/v1/security/csp-report`)
3. Adjust CSP policy as needed
4. Test changes in staging first

---

## Related Documentation

- [Security Hardening](../project-management/SECURITY_HARDENING_IMPLEMENTATION.md)
- [Deployment Runbook](../deployment/DEPLOYMENT_RUNBOOK.md)
- [Common Issues Runbook](./COMMON_ISSUES_RUNBOOK.md)

---

**Last Updated**: 2025-11-29  
**Maintained By**: DevOps Team

