# Accessibility Testing Guide

This guide helps you run the accessibility tests and verify all the improvements we've made.

## Quick Start

### 1. Color Contrast Check ✅ (No Installation Required)

Run the contrast checker script:

```bash
node scripts/check-contrast.js
```

This will:
- Analyze all color combinations in the application
- Check WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
- Generate a report in `accessibility-reports/contrast-report.json`

### 2. Full Accessibility Test Suite (Requires Installation)

The comprehensive test script requires some tools to be installed. Install them with:

```bash
# Install Lighthouse (Chrome DevTools)
npm install -g lighthouse

# Install Pa11y (WAVE alternative)
npm install -g pa11y

# Install aXe CLI (Contrast and accessibility checking)
npm install -g @axe-core/cli
```

Then run the full test suite:

```bash
# Make sure frontend is running first
cd frontend && npm run dev

# In another terminal, run the tests
./scripts/accessibility-test.sh
```

The script will:
- Run Lighthouse accessibility audit
- Run Pa11y/WAVE evaluation
- Check color contrast with aXe
- Generate reports in `accessibility-reports/`

### 3. Manual Testing

#### Test Keyboard Shortcuts

1. Start the frontend: `cd frontend && npm run dev`
2. Open the app in your browser: http://localhost:1000
3. Press `Ctrl+K` (Windows/Linux) or `Cmd+K` (Mac) to open keyboard shortcuts
4. Or press `Ctrl+/` or `Cmd+/`
5. Try searching for shortcuts
6. Test the shortcuts listed in the dialog

#### Test Skip Links

1. With the app open, press `Tab` to focus on the first element
2. You should see skip links appear:
   - "Skip to main content"
   - "Skip to navigation"
   - "Skip to search"
3. Press `Enter` on any skip link to jump to that section
4. Continue tabbing to verify focus management

#### Test Reduced Motion

1. Enable reduced motion in your OS:
   - **macOS**: System Preferences → Accessibility → Display → Reduce motion
   - **Windows**: Settings → Ease of Access → Display → Show animations
   - **Linux**: Varies by desktop environment
2. Reload the app
3. Verify animations are minimal or removed

#### Test Focus Indicators

1. Tab through the application
2. Verify all interactive elements show clear focus indicators:
   - 3px blue outline
   - Box shadow for better visibility
3. Test in high contrast mode (if available)

#### Test Error Announcements

1. Trigger an error in the application
2. Use a screen reader (NVDA, JAWS, VoiceOver) or browser accessibility tools
3. Verify the error is announced with:
   - Severity level
   - Error message
   - Context information
   - Recovery options count
   - Suggestions count

## Browser-Based Testing

### Chrome DevTools

1. Open Chrome DevTools (F12)
2. Go to the "Lighthouse" tab
3. Select "Accessibility" category
4. Click "Generate report"
5. Review the accessibility score and issues

### WAVE Browser Extension

1. Install WAVE extension: https://wave.webaim.org/extension/
2. Navigate to your app
3. Click the WAVE icon in your browser
4. Review the accessibility report

### axe DevTools Extension

1. Install axe DevTools: https://www.deque.com/axe/devtools/
2. Open DevTools
3. Go to the "axe DevTools" tab
4. Click "Scan" to analyze the page
5. Review violations and recommendations

## Screen Reader Testing

### NVDA (Windows - Free)

1. Download: https://www.nvaccess.org/
2. Start NVDA
3. Navigate through the app using keyboard
4. Listen to announcements

### JAWS (Windows - Paid)

1. Professional screen reader
2. Test with full keyboard navigation
3. Verify all content is announced

### VoiceOver (macOS/iOS - Built-in)

1. Enable: System Preferences → Accessibility → VoiceOver
2. Or press `Cmd+F5`
3. Navigate with VoiceOver commands
4. Test all interactive elements

## CI/CD Integration

Add to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run Accessibility Tests
  run: |
    npm install -g lighthouse pa11y @axe-core/cli
    npm run dev &
    sleep 10
    ./scripts/accessibility-test.sh
```

## Expected Results

### Lighthouse Score
- **Target**: 90+ accessibility score
- **Current**: Run test to see baseline

### Color Contrast
- **Target**: All combinations pass WCAG AA (4.5:1)
- **Check**: Run `node scripts/check-contrast.js`

### Keyboard Navigation
- **Target**: 100% keyboard accessible
- **Test**: Tab through entire application

### Screen Reader
- **Target**: All content announced correctly
- **Test**: Use NVDA, JAWS, or VoiceOver

## Troubleshooting

### Frontend Not Running
```bash
cd frontend
npm run dev
# Should start on http://localhost:1000
```

### Scripts Not Executable
```bash
chmod +x scripts/accessibility-test.sh
chmod +x scripts/check-contrast.js
```

### Tools Not Found
Install missing tools:
```bash
npm install -g lighthouse pa11y @axe-core/cli
```

## Next Steps

1. ✅ Run contrast checker: `node scripts/check-contrast.js`
2. ⚠️ Install testing tools (if needed)
3. ⚠️ Run full test suite: `./scripts/accessibility-test.sh`
4. ✅ Test keyboard shortcuts manually
5. ✅ Test skip links manually
6. ⚠️ Run Lighthouse audit in browser
7. ⚠️ Test with screen reader

All automated scripts are ready to use. Manual testing can be done immediately with the running frontend.

