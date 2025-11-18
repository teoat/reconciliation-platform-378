# Google OAuth Diagnostic - Quick Start

## 🚀 Quick Commands

### Run Full Diagnostic (Recommended)

```bash
./diagnose-google-oauth.sh
```

This will:
- ✅ Check if servers are running
- ✅ Launch browser with Chrome DevTools
- ✅ Run all diagnostic checks
- ✅ Generate comprehensive report

### Alternative: Playwright Test

```bash
cd frontend
npm run test:e2e:google-oauth:headed
```

### Debug Mode (Step through)

```bash
cd frontend
npm run test:e2e:google-oauth:debug
```

## 📊 What Gets Checked

1. **Page Load** - Login page loads successfully
2. **Environment Variable** - `VITE_GOOGLE_CLIENT_ID` is set and valid
3. **Google Script** - Google Identity Services loads
4. **Console Errors** - All console messages captured (via DevTools)
5. **Network Requests** - All Google API requests monitored
6. **Google Button** - Button exists and is visible
7. **Button Functionality** - Button opens OAuth popup

## 📁 Output Location

All results saved to:
```
test-results/google-oauth-diagnostic/
├── diagnostic-report-*.json  # Full diagnostic report
├── screenshots/               # Page screenshots
└── videos/                    # Browser session recording
```

## 🔍 Using Chrome DevTools

### Console Logs

All console messages are automatically captured:
- `console.log()` → Logged
- `console.error()` → Highlighted in report
- `console.warn()` → Highlighted in report

### Network Tab

All network requests are monitored:
- Request URL
- Request method
- Response status
- Response headers
- Error messages (if failed)

### Access DevTools Manually

When running in headed mode, DevTools are enabled:
```bash
npm run test:e2e:google-oauth:headed
```

## 🐛 Common Issues & Fixes

### Issue: "Cannot find module '@playwright/test'"

**Fix:** Run from frontend directory:
```bash
cd frontend
npm run test:e2e:google-oauth
```

### Issue: "Frontend server not running"

**Fix:** Start frontend first:
```bash
cd frontend
npm run dev
```

### Issue: "Script timeout"

**Fix:** Increase timeout in diagnostic script or check:
- Internet connection
- Google services accessible
- CSP (Content Security Policy) allows Google scripts

## 📝 Report Structure

```json
{
  "timestamp": "2025-01-16T10:30:00Z",
  "checks": [
    {
      "name": "Page Load",
      "status": "pass",
      "message": "Login page loaded successfully"
    }
  ],
  "consoleLogs": [...],
  "networkRequests": [...],
  "summary": {
    "total": 7,
    "passed": 6,
    "failed": 1,
    "warnings": 0
  }
}
```

## 🎯 Next Steps

1. **Run diagnostic:** `./diagnose-google-oauth.sh`
2. **Review report:** Check `test-results/google-oauth-diagnostic/`
3. **Fix issues:** Address any failed checks
4. **Re-run:** Verify fixes worked

## 📚 More Information

- [Full Diagnostic Guide](./GOOGLE_OAUTH_DIAGNOSTIC_GUIDE.md)
- [Setup Guide](./GOOGLE_OAUTH_SETUP.md)
- [Next Steps](./GOOGLE_OAUTH_NEXT_STEPS.md)

