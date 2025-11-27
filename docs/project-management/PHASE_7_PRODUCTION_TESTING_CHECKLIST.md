# Phase 7: Production Testing Checklist

**Date**: 2025-01-15  
**Agent**: Agent 3 (Frontend Organizer)  
**Status**: ✅ Ready for Execution  
**Phase**: Phase 7 - Production Deployment & Operations

---

## Quick Start

1. **Run Automated Script**:
   ```bash
   cd frontend
   FRONTEND_URL=https://your-production-domain.com \
   API_URL=https://api.example.com \
   ./scripts/verify-production.sh
   ```

2. **Follow Manual Checklist**: See sections below

3. **Document Results**: Use the template at the end

---

## Pre-Deployment Checklist

Before testing in production, ensure:

- [ ] Production deployment is complete
- [ ] Frontend URL is accessible
- [ ] API backend is accessible
- [ ] Environment variables are configured
- [ ] SSL certificates are valid (if using HTTPS)
- [ ] DNS is configured correctly
- [ ] Monitoring is set up

---

## Automated Testing

### Run Production Verification Script

```bash
# Basic usage
cd frontend
./scripts/verify-production.sh

# With custom URLs
FRONTEND_URL=https://app.example.com \
API_URL=https://api.example.com \
./scripts/verify-production.sh
```

**Expected Results**:
- ✅ Frontend accessible
- ✅ Health endpoints responding
- ✅ Static assets loading
- ✅ Cache headers present
- ✅ Compression enabled
- ✅ Security headers present
- ✅ Performance acceptable

---

## Manual Testing Checklist

### 1. Basic Functionality

#### Frontend Loading
- [ ] Frontend URL accessible
- [ ] No console errors on page load
- [ ] HTML loads correctly (`<!DOCTYPE html>`)
- [ ] Page renders correctly
- [ ] No 404 errors

**Test**:
```bash
curl -I https://your-production-domain.com
curl https://your-production-domain.com | grep -q "<!DOCTYPE html>" && echo "✅"
```

#### Health Endpoints
- [ ] `/health` returns `200 OK` with "healthy"
- [ ] `/healthz` returns `200 OK` with "ok"
- [ ] Response time < 100ms

**Test**:
```bash
curl https://your-production-domain.com/health
curl https://your-production-domain.com/healthz
```

---

### 2. Static Assets

#### Asset Loading
- [ ] JavaScript bundles load
- [ ] CSS files load
- [ ] Images load
- [ ] Fonts load
- [ ] No broken asset links

**Test**:
```bash
# Check for 404s in browser DevTools Network tab
# Or use curl to test specific assets
```

#### Cache Headers
- [ ] Static assets have `Cache-Control: public, max-age=31536000, immutable`
- [ ] HTML has appropriate cache headers
- [ ] Cache headers correct for each asset type

**Test**:
```bash
curl -I https://your-production-domain.com/assets/index-*.js | grep -i cache-control
```

#### Compression
- [ ] Gzip compression enabled
- [ ] Brotli compression available (if configured)
- [ ] Compression reduces file sizes

**Test**:
```bash
curl -H "Accept-Encoding: gzip" -I https://your-production-domain.com/assets/index-*.js | grep -i content-encoding
```

---

### 3. Performance

#### Load Times
- [ ] Initial page load < 2 seconds
- [ ] TTFB < 500ms
- [ ] FCP < 1.5 seconds
- [ ] LCP < 2.5 seconds
- [ ] TTI < 3.5 seconds

**Tools**: Chrome DevTools Lighthouse, WebPageTest

#### Bundle Sizes
- [ ] Initial bundle < 200 KB (gzipped)
- [ ] Total bundle < 2 MB (gzipped)
- [ ] Code splitting working
- [ ] Lazy loading working

**Test**:
```bash
curl -H "Accept-Encoding: gzip" -s https://your-production-domain.com/assets/index-*.js | wc -c
```

---

### 4. API Integration

#### API Connectivity
- [ ] API health check accessible
- [ ] API requests succeed
- [ ] API responses correct
- [ ] CORS headers configured
- [ ] Authentication working

**Test**:
```bash
curl https://api.example.com/api/health
```

#### WebSocket
- [ ] WebSocket connection establishes
- [ ] Messages send/receive
- [ ] Reconnection works
- [ ] Errors handled gracefully

---

### 5. Error Handling

#### Error Tracking
- [ ] Errors caught and logged
- [ ] Error tracking initialized
- [ ] Errors appear in dashboard
- [ ] Error boundaries catch React errors
- [ ] Network errors handled

**Test**:
```javascript
// In browser console
throw new Error('Test error');
```

---

### 6. Monitoring

#### Performance Monitoring
- [ ] Performance monitoring initialized
- [ ] Core Web Vitals tracked
- [ ] Metrics collected
- [ ] Data visible in dashboard

#### Analytics
- [ ] Analytics tracking initialized
- [ ] Page views tracked
- [ ] User interactions tracked
- [ ] Custom events tracked

---

### 7. Security

#### Security Headers
- [ ] Content-Security-Policy present
- [ ] X-Frame-Options present
- [ ] X-Content-Type-Options present
- [ ] X-XSS-Protection present
- [ ] Referrer-Policy present

**Test**:
```bash
curl -I https://your-production-domain.com | grep -iE "(content-security-policy|x-frame-options)"
```

#### HTTPS
- [ ] HTTPS enabled
- [ ] SSL certificate valid
- [ ] No mixed content warnings
- [ ] HSTS configured (if applicable)

---

### 8. Browser Compatibility

#### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

#### Mobile Browsers
- [ ] iOS Safari
- [ ] Chrome Mobile
- [ ] Responsive design works
- [ ] Touch interactions work

---

### 9. Environment Configuration

#### Environment Variables
- [ ] API URL configured
- [ ] WebSocket URL configured
- [ ] OAuth client ID configured (if used)
- [ ] APM server URL configured (if used)
- [ ] All required variables set

**Test**:
```bash
# Check environment in browser console
console.log(import.meta.env);
```

---

## Performance Testing

### Lighthouse Audit

**Target Scores**:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

**How to Run**:
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select categories
4. Click "Generate report"

### WebPageTest

**Target Metrics**:
- First Contentful Paint: < 1.5s
- Speed Index: < 3.0s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.5s
- Total Blocking Time: < 200ms
- Cumulative Layout Shift: < 0.1

**How to Run**:
1. Go to https://www.webpagetest.org/
2. Enter production URL
3. Select test location
4. Run test

---

## Monitoring Verification

### Error Tracking

1. **Trigger Test Error**:
   ```javascript
   throw new Error('Test error for monitoring');
   ```

2. **Verify in Dashboard**:
   - Check Elastic APM dashboard
   - Verify error appears
   - Verify error context
   - Verify error severity

### Performance Monitoring

1. **Check Metrics**:
   ```javascript
   console.log(performance.getEntriesByType('navigation'));
   ```

2. **Verify in Dashboard**:
   - Check Elastic APM dashboard
   - Verify metrics collected
   - Verify Core Web Vitals
   - Verify custom metrics

---

## Testing Report Template

```markdown
# Production Testing Report

**Date**: YYYY-MM-DD
**Tester**: [Name]
**Environment**: Production
**Frontend URL**: https://app.example.com
**API URL**: https://api.example.com

## Automated Test Results

[Paste output from verify-production.sh]

## Manual Test Results

### Basic Functionality
- [ ] Frontend loading: ✅/❌
- [ ] Health endpoints: ✅/❌
- [ ] Static assets: ✅/❌

### Performance
- [ ] Load times: ✅/❌
- [ ] Bundle sizes: ✅/❌
- [ ] Lighthouse score: [Score]

### API Integration
- [ ] API connectivity: ✅/❌
- [ ] WebSocket: ✅/❌

### Monitoring
- [ ] Error tracking: ✅/❌
- [ ] Performance monitoring: ✅/❌

### Security
- [ ] Security headers: ✅/❌
- [ ] HTTPS: ✅/❌

### Browser Compatibility
- [ ] Chrome: ✅/❌
- [ ] Firefox: ✅/❌
- [ ] Safari: ✅/❌
- [ ] Edge: ✅/❌
- [ ] Mobile: ✅/❌

## Issues Found

[List any issues]

## Recommendations

[List recommendations]

## Next Steps

[List next steps]
```

---

## Troubleshooting

### Frontend Not Loading
1. Check DNS: `nslookup your-domain.com`
2. Check server: `curl -I https://your-domain.com`
3. Check logs: nginx, container, application logs

### Assets Not Loading
1. Check asset URLs
2. Check base path configuration
3. Check CDN configuration
4. Clear cache

### API Errors
1. Check API connectivity
2. Check CORS headers
3. Check authentication
4. Review API logs

---

## Next Steps After Testing

1. ✅ Document test results
2. ✅ Monitor production metrics
3. ✅ Review performance data
4. ✅ Optimize based on metrics
5. ✅ Set up alerts
6. ✅ Schedule regular testing

---

**Checklist Generated**: 2025-01-15  
**Agent**: Agent 3 (Frontend Organizer)  
**Status**: ✅ **READY FOR PRODUCTION TESTING**

