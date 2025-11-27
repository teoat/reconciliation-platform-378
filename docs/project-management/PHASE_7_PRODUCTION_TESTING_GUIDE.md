# Phase 7: Production Testing Guide

**Date**: 2025-01-15  
**Agent**: Agent 3 (Frontend Organizer)  
**Status**: ✅ Ready for Execution  
**Phase**: Phase 7 - Production Deployment & Operations

---

## Summary

This guide provides comprehensive instructions for testing the frontend in a production environment after deployment. It includes automated scripts, manual testing procedures, and verification checklists.

---

## Quick Start

### Automated Testing

Run the production verification script:

```bash
cd frontend
chmod +x scripts/verify-production.sh
FRONTEND_URL=https://your-production-domain.com ./scripts/verify-production.sh
```

### Manual Testing

Follow the [Production Testing Checklist](#production-testing-checklist) below.

---

## Prerequisites

Before testing, ensure:

1. ✅ Production deployment is complete
2. ✅ Frontend URL is accessible
3. ✅ API backend is accessible
4. ✅ Environment variables are configured
5. ✅ SSL certificates are valid (if using HTTPS)

---

## Automated Production Testing

### Enhanced Verification Script

**Location**: `frontend/scripts/verify-production.sh`

**Usage**:
```bash
# Basic usage (defaults to localhost:3000)
./frontend/scripts/verify-production.sh

# With custom URLs
FRONTEND_URL=https://app.example.com \
API_URL=https://api.example.com \
./frontend/scripts/verify-production.sh
```

**What It Tests**:
- ✅ Frontend accessibility
- ✅ Health endpoints (`/health`, `/healthz`)
- ✅ HTML loading
- ✅ Static asset loading
- ✅ Cache headers
- ✅ Compression (gzip/brotli)
- ✅ API connectivity
- ✅ Response times
- ✅ Environment configuration

**Expected Output**:
```
🚀 Starting Production Verification
Frontend URL: https://app.example.com
API URL: https://api.example.com

ℹ️  Checking frontend accessibility...
✅ Frontend is accessible
ℹ️  Checking health endpoint...
✅ Health endpoint responding
ℹ️  Checking index.html...
✅ index.html loads correctly
ℹ️  Checking static assets...
✅ Static assets load correctly
✅ Cache headers present: cache-control: public, max-age=31536000, immutable
✅ Compression enabled: content-encoding: gzip
ℹ️  Checking API connectivity...
✅ API is accessible
ℹ️  Checking environment configuration...
✅ Application content detected
ℹ️  Checking performance...
✅ Response time acceptable: 0.234s

✅ Production verification complete!

Summary:
  - Frontend: ✅ Accessible
  - Health: ✅ Responding
  - Assets: ✅ Loading
  - Performance: ✅ Acceptable
```

---

## Production Testing Checklist

### 1. Basic Functionality ✅

#### Frontend Loading
- [ ] Frontend URL is accessible
- [ ] No console errors on page load
- [ ] HTML loads correctly
- [ ] All static assets load (JS, CSS, images, fonts)
- [ ] No 404 errors for assets
- [ ] Page renders correctly

**Test Command**:
```bash
curl -I https://your-production-domain.com
curl https://your-production-domain.com | grep -q "<!DOCTYPE html>" && echo "✅ HTML loads"
```

#### Health Endpoints
- [ ] `/health` returns `200 OK` with "healthy"
- [ ] `/healthz` returns `200 OK` with "ok"
- [ ] Health checks respond quickly (< 100ms)

**Test Command**:
```bash
curl https://your-production-domain.com/health
curl https://your-production-domain.com/healthz
```

---

### 2. Static Assets ✅

#### Asset Loading
- [ ] All JavaScript bundles load
- [ ] All CSS files load
- [ ] All images load
- [ ] All fonts load
- [ ] No broken asset links

**Test Command**:
```bash
# Extract and test asset URLs
curl -s https://your-production-domain.com | \
  grep -oP 'src="[^"]*\.js"' | \
  sed 's/src="//;s/"//' | \
  while read asset; do
    curl -I "https://your-production-domain.com$asset" | head -1
  done
```

#### Cache Headers
- [ ] Static assets have `Cache-Control: public, max-age=31536000, immutable`
- [ ] HTML has appropriate cache headers (short-term or no-cache)
- [ ] Cache headers are correct for each asset type

**Test Command**:
```bash
# Check cache headers for JS assets
curl -I https://your-production-domain.com/assets/index-*.js | grep -i cache-control
```

#### Compression
- [ ] Gzip compression enabled for text assets
- [ ] Brotli compression available (if configured)
- [ ] Compression reduces file sizes significantly

**Test Command**:
```bash
# Test gzip compression
curl -H "Accept-Encoding: gzip" -I https://your-production-domain.com/assets/index-*.js | grep -i content-encoding

# Compare sizes
curl -s https://your-production-domain.com/assets/index-*.js | wc -c
curl -H "Accept-Encoding: gzip" -s https://your-production-domain.com/assets/index-*.js | wc -c
```

---

### 3. Performance ✅

#### Load Times
- [ ] Initial page load < 2 seconds
- [ ] Time to First Byte (TTFB) < 500ms
- [ ] First Contentful Paint (FCP) < 1.5 seconds
- [ ] Largest Contentful Paint (LCP) < 2.5 seconds
- [ ] Time to Interactive (TTI) < 3.5 seconds

**Test Tools**:
- Chrome DevTools Lighthouse
- WebPageTest
- Google PageSpeed Insights

**Test Command**:
```bash
# Measure response time
time curl -o /dev/null -s https://your-production-domain.com
```

#### Bundle Sizes
- [ ] Initial bundle < 200 KB (gzipped)
- [ ] Total bundle size < 2 MB (gzipped)
- [ ] Code splitting working (multiple chunks)
- [ ] Lazy loading working (chunks load on demand)

**Test Command**:
```bash
# Check bundle sizes
curl -H "Accept-Encoding: gzip" -s https://your-production-domain.com/assets/index-*.js | wc -c
```

---

### 4. API Integration ✅

#### API Connectivity
- [ ] API health check endpoint accessible
- [ ] API requests succeed
- [ ] API responses are correct
- [ ] CORS headers configured correctly
- [ ] Authentication working

**Test Command**:
```bash
# Test API health
curl https://api.example.com/api/health

# Test API with authentication
curl -H "Authorization: Bearer $TOKEN" https://api.example.com/api/v1/projects
```

#### WebSocket Connectivity
- [ ] WebSocket connection establishes
- [ ] WebSocket messages send/receive
- [ ] WebSocket reconnection works
- [ ] WebSocket errors handled gracefully

**Test Command**:
```bash
# Test WebSocket (requires wscat or similar)
wscat -c wss://your-production-domain.com/ws
```

---

### 5. Error Handling ✅

#### Error Tracking
- [ ] Errors are caught and logged
- [ ] Error tracking service initialized
- [ ] Errors appear in monitoring dashboard
- [ ] Error boundaries catch React errors
- [ ] Network errors handled gracefully

**Test Command**:
```javascript
// In browser console
// Trigger a test error
throw new Error('Test error for monitoring');
```

#### Error Reporting
- [ ] Errors sent to Elastic APM (if configured)
- [ ] Error context included
- [ ] Error severity levels correct
- [ ] Error aggregation working

---

### 6. Monitoring ✅

#### Performance Monitoring
- [ ] Performance monitoring initialized
- [ ] Core Web Vitals tracked
- [ ] Performance metrics collected
- [ ] Performance data visible in dashboard

**Test Command**:
```javascript
// In browser console
// Check if performance monitoring is active
console.log(window.performance.getEntriesByType('navigation'));
```

#### Analytics
- [ ] Analytics tracking initialized
- [ ] Page views tracked
- [ ] User interactions tracked
- [ ] Custom events tracked

---

### 7. Security ✅

#### Security Headers
- [ ] Content-Security-Policy header present
- [ ] X-Frame-Options header present
- [ ] X-Content-Type-Options header present
- [ ] X-XSS-Protection header present
- [ ] Referrer-Policy header present

**Test Command**:
```bash
# Check security headers
curl -I https://your-production-domain.com | grep -iE "(content-security-policy|x-frame-options|x-content-type-options|x-xss-protection|referrer-policy)"
```

#### HTTPS
- [ ] HTTPS enabled
- [ ] SSL certificate valid
- [ ] No mixed content warnings
- [ ] HSTS header configured (if applicable)

**Test Command**:
```bash
# Check SSL certificate
openssl s_client -connect your-production-domain.com:443 -servername your-production-domain.com < /dev/null
```

---

### 8. Environment Configuration ✅

#### Environment Variables
- [ ] API URL configured correctly
- [ ] WebSocket URL configured correctly
- [ ] Google OAuth client ID configured (if used)
- [ ] APM server URL configured (if used)
- [ ] All required environment variables set

**Test Command**:
```bash
# Check environment variables in build
curl -s https://your-production-domain.com | grep -oP 'VITE_[A-Z_]+' | sort -u
```

---

## Browser Testing

### Supported Browsers

Test in the following browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

### Browser-Specific Tests

#### Chrome
- [ ] DevTools console shows no errors
- [ ] Network tab shows all assets loading
- [ ] Performance tab shows good metrics
- [ ] Lighthouse score > 90

#### Firefox
- [ ] Console shows no errors
- [ ] Network monitor shows all assets
- [ ] Performance profiler shows good metrics

#### Safari
- [ ] No console errors
- [ ] Web Inspector shows assets loading
- [ ] Performance shows good metrics

---

## Mobile Testing

### Mobile Devices

Test on:
- [ ] iOS devices (iPhone, iPad)
- [ ] Android devices (various screen sizes)
- [ ] Responsive design works
- [ ] Touch interactions work
- [ ] Mobile performance acceptable

### Mobile-Specific Tests

- [ ] Viewport meta tag correct
- [ ] Touch targets adequate size
- [ ] Scrolling smooth
- [ ] Images load correctly
- [ ] Forms work on mobile
- [ ] Navigation works on mobile

---

## Performance Testing

### Lighthouse Audit

Run Lighthouse audit:

```bash
# Using Chrome DevTools
# 1. Open Chrome DevTools
# 2. Go to Lighthouse tab
# 3. Select "Performance", "Accessibility", "Best Practices", "SEO"
# 4. Click "Generate report"
```

**Target Scores**:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

### WebPageTest

Test on WebPageTest:

1. Go to https://www.webpagetest.org/
2. Enter production URL
3. Select test location
4. Run test
5. Review results

**Target Metrics**:
- First Contentful Paint: < 1.5s
- Speed Index: < 3.0s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.5s
- Total Blocking Time: < 200ms
- Cumulative Layout Shift: < 0.1

---

## Monitoring Verification

### Error Tracking

1. **Trigger Test Error**:
   ```javascript
   // In browser console
   throw new Error('Test error for monitoring');
   ```

2. **Verify in Dashboard**:
   - Check Elastic APM dashboard
   - Verify error appears
   - Verify error context included
   - Verify error severity correct

### Performance Monitoring

1. **Check Performance Metrics**:
   ```javascript
   // In browser console
   console.log(performance.getEntriesByType('navigation'));
   console.log(performance.getEntriesByType('resource'));
   ```

2. **Verify in Dashboard**:
   - Check Elastic APM dashboard
   - Verify performance metrics collected
   - Verify Core Web Vitals tracked
   - Verify custom metrics tracked

---

## Troubleshooting

### Frontend Not Loading

1. **Check DNS**:
   ```bash
   nslookup your-production-domain.com
   ```

2. **Check Server**:
   ```bash
   curl -I https://your-production-domain.com
   ```

3. **Check Logs**:
   - Check nginx logs
   - Check container logs
   - Check application logs

### Assets Not Loading

1. **Check Asset URLs**:
   - Verify asset paths correct
   - Check base path configuration
   - Verify CDN configuration

2. **Check Cache**:
   - Clear browser cache
   - Check CDN cache
   - Verify cache headers

### API Errors

1. **Check API Connectivity**:
   ```bash
   curl https://api.example.com/api/health
   ```

2. **Check CORS**:
   - Verify CORS headers
   - Check allowed origins
   - Verify credentials handling

---

## Production Testing Report Template

After testing, document results:

```markdown
# Production Testing Report

**Date**: YYYY-MM-DD
**Tester**: [Name]
**Environment**: Production
**Frontend URL**: https://app.example.com
**API URL**: https://api.example.com

## Test Results

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

## Issues Found

[List any issues found]

## Recommendations

[List recommendations for improvements]
```

---

## Next Steps

After successful production testing:

1. ✅ Document test results
2. ✅ Monitor production metrics
3. ✅ Review performance data
4. ✅ Optimize based on metrics
5. ✅ Set up alerts
6. ✅ Schedule regular testing

---

## Files Modified

### Created:
- `docs/project-management/PHASE_7_PRODUCTION_TESTING_GUIDE.md` (this file)

### Enhanced:
- `frontend/scripts/verify-production.sh` (enhanced with more checks)

---

**Report Generated**: 2025-01-15  
**Agent**: Agent 3 (Frontend Organizer)  
**Status**: ✅ **PRODUCTION TESTING GUIDE READY**

