# Content Security Policy (CSP) Documentation

**Last Updated**: January 2025  
**Status**: ✅ Implemented

---

## Overview

The application implements a comprehensive Content Security Policy (CSP) to protect against XSS attacks, data injection, and other security vulnerabilities. The CSP is configured in `backend/src/middleware/security/headers.rs`.

---

## CSP Directives

### Current Policy

```
default-src 'self';
script-src 'self' 'nonce-{nonce}' 'strict-dynamic';
style-src 'self' 'nonce-{nonce}' 'unsafe-inline';
img-src 'self' data: https: blob:;
font-src 'self' data: https:;
connect-src 'self' https: wss: ws:;
frame-src 'self' https:;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
block-all-mixed-content;
report-uri /api/security/csp-report;
```

### Directive Explanations

#### `default-src 'self'`
- Default source for all resource types
- Only allows resources from the same origin

#### `script-src 'self' 'nonce-{nonce}' 'strict-dynamic'`
- Allows scripts from same origin
- Uses nonce-based CSP for inline scripts
- `'strict-dynamic'` allows scripts loaded by trusted scripts

#### `style-src 'self' 'nonce-{nonce}' 'unsafe-inline'`
- Allows styles from same origin
- Uses nonce for inline styles
- `'unsafe-inline'` required for some CSS frameworks (consider removing if possible)

#### `img-src 'self' data: https: blob:`
- Allows images from same origin, data URIs, HTTPS, and blob URIs
- Supports user-uploaded images and external CDNs

#### `font-src 'self' data: https:`
- Allows fonts from same origin, data URIs, and HTTPS
- Supports web fonts from CDNs

#### `connect-src 'self' https: wss: ws:`
- Allows connections to same origin, HTTPS, WebSocket Secure, and WebSocket
- Required for API calls and real-time features

#### `frame-src 'self' https:`
- Allows iframes from same origin and HTTPS
- Required for embedded content (e.g., Google Sign-In)

#### `frame-ancestors 'none'`
- Prevents the page from being embedded in frames
- Protects against clickjacking attacks

#### `base-uri 'self'`
- Restricts base tag URLs to same origin
- Prevents base tag injection attacks

#### `form-action 'self'`
- Restricts form submissions to same origin
- Prevents form hijacking

#### `upgrade-insecure-requests`
- Automatically upgrades HTTP requests to HTTPS
- Ensures secure connections

#### `block-all-mixed-content`
- Blocks mixed content (HTTP resources on HTTPS pages)
- Ensures all resources are loaded securely

#### `report-uri /api/security/csp-report`
- Sends CSP violation reports to the specified endpoint
- Enables monitoring and debugging of CSP issues

---

## Nonce Implementation

The CSP uses nonce-based security for inline scripts and styles:

1. **Nonce Generation**: A unique nonce is generated per request using UUID
2. **Nonce Storage**: The nonce is stored in request extensions as `CspNonce`
3. **Nonce Usage**: The nonce is included in the CSP header and can be used in templates

### Using Nonces in Frontend

```typescript
// Get nonce from server response headers or API
const nonce = getCspNonce(); // Implement this based on your setup

// Use in inline scripts
<script nonce={nonce}>
  // Your inline script
</script>

// Use in inline styles
<style nonce={nonce}>
  /* Your inline styles */
</style>
```

---

## CSP Reporting

### Report Endpoint

CSP violations are reported to: `/api/security/csp-report`

### Report Format

CSP violation reports are sent as JSON with the following structure:

```json
{
  "csp-report": {
    "document-uri": "https://example.com/page",
    "referrer": "https://example.com/",
    "violated-directive": "script-src",
    "effective-directive": "script-src",
    "original-policy": "default-src 'self'; script-src 'self' 'nonce-...'; ...",
    "disposition": "enforce",
    "blocked-uri": "https://malicious.com/script.js",
    "line-number": 42,
    "column-number": 10,
    "source-file": "https://example.com/page",
    "status-code": 200,
    "script-sample": "alert('xss')"
  }
}
```

### Implementing the Report Handler

✅ **COMPLETE**: CSP report handler endpoint implemented in `backend/src/handlers/security.rs`

**Endpoint**: `POST /api/security/csp-report`

**Implementation**:
- Receives CSP violation reports from browsers
- Logs violations at WARN level for monitoring
- Logs full report details at DEBUG level
- Returns 204 No Content (per CSP specification)

**Future Enhancements** (optional):
- Store violations in database for analysis
- Send to security monitoring service
- Alert security team for critical violations
- Aggregate violations for policy tuning

---

## Testing CSP

### Browser DevTools

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for CSP violation warnings
4. Check Network tab for CSP report requests

### Testing Tools

- **CSP Evaluator**: https://csp-evaluator.withgoogle.com/
- **CSP Validator**: Browser extensions available

### Common Issues

1. **Inline Scripts**: Use nonces or move to external files
2. **External Resources**: Add to appropriate directive (e.g., `img-src`, `font-src`)
3. **WebSockets**: Ensure `connect-src` includes `wss:`
4. **Third-party Scripts**: Add to `script-src` or use `'strict-dynamic'`

---

## Configuration

### Backend Configuration

CSP is configured in `backend/src/middleware/security/headers.rs`:

```rust
let config = SecurityHeadersConfig {
    enable_csp: true,
    csp_directives: None, // Uses default policy
    // ... other settings
};
```

### Custom CSP Policy

To use a custom CSP policy:

```rust
let config = SecurityHeadersConfig {
    enable_csp: true,
    csp_directives: Some("your-custom-csp-policy".to_string()),
    // ... other settings
};
```

---

## Security Considerations

### Strengths

✅ Nonce-based CSP for inline scripts/styles  
✅ Strict default-src policy  
✅ Frame-ancestors protection  
✅ Mixed content blocking  
✅ CSP violation reporting  

### Areas for Improvement

⚠️ **`'unsafe-inline'` in style-src**: Consider removing if possible  
✅ **CSP Report Handler**: ✅ Implemented in `backend/src/handlers/security.rs`  
⚠️ **Report-Only Mode**: Consider adding for testing  

---

## Migration Guide

### From No CSP to CSP

1. Deploy with `Content-Security-Policy-Report-Only` header first
2. Monitor CSP violation reports
3. Fix violations
4. Switch to enforcing mode

### Adding New External Resources

1. Identify the resource type (script, style, image, etc.)
2. Add the domain to the appropriate directive
3. Test thoroughly
4. Monitor CSP reports

---

## References

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [OWASP: Content Security Policy](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)

---

**Last Updated**: January 2025  
**Maintained By**: Agent 1 - Security Team

