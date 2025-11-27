# Quick Start: Frontend Diagnostics

## 🚀 One Command to Run Everything

```bash
./scripts/start-frontend-and-diagnose.sh
```

That's it! The script will:
- ✅ Start frontend server
- ✅ Run all diagnostic tests
- ✅ Generate comprehensive reports

## 📊 Reports Generated

After running, check:
- **JSON Report:** `test-results/frontend-diagnostic-report.json`
- **Markdown Report:** `docs/project-management/FRONTEND_UI_UX_PLAYWRIGHT_DIAGNOSTIC.md`
- **HTML Report:** `test-results/html-report/index.html` (open in browser)

## 🔍 What's Tested

- ✅ All 19 routes functionality
- ✅ Navigation links and buttons
- ✅ Performance metrics (load times, FCP, LCP, CLS)
- ✅ Accessibility compliance
- ✅ Console and network errors
- ✅ Clickable elements audit

## ⚡ Quick Troubleshooting

**Frontend won't start?**
```bash
cd frontend && npm install && npm run dev
```

**Playwright not installed?**
```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

**Port 1000 in use?**
```bash
lsof -i :1000  # See what's using it
```

## 📖 Full Guide

See `docs/project-management/IMPLEMENTATION_GUIDE.md` for detailed instructions.

