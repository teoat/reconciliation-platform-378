#!/bin/bash

# Accessibility Testing Script
# Runs automated accessibility tests including Lighthouse, WAVE, and contrast checking

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Accessibility Testing Suite${NC}\n"

# Configuration
FRONTEND_URL="${FRONTEND_URL:-http://localhost:1000}"
OUTPUT_DIR="./accessibility-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Frontend URL: $FRONTEND_URL"
echo "  Output Directory: $OUTPUT_DIR"
echo ""

# Check if frontend is running
echo -e "${YELLOW}Checking if frontend is running...${NC}"
if ! curl -s -f "$FRONTEND_URL" > /dev/null; then
    echo -e "${RED}Error: Frontend is not running at $FRONTEND_URL${NC}"
    echo "Please start the frontend with: cd frontend && npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ Frontend is running${NC}\n"

# 1. Lighthouse Accessibility Audit
echo -e "${YELLOW}[1/3] Running Lighthouse Accessibility Audit...${NC}"
if command -v lighthouse &> /dev/null; then
    lighthouse "$FRONTEND_URL" \
        --only-categories=accessibility \
        --output=html,json \
        --output-path="$OUTPUT_DIR/lighthouse-accessibility-$TIMESTAMP" \
        --chrome-flags="--headless" \
        --quiet
    
    LIGHTHOUSE_HTML="$OUTPUT_DIR/lighthouse-accessibility-$TIMESTAMP.report.html"
    LIGHTHOUSE_JSON="$OUTPUT_DIR/lighthouse-accessibility-$TIMESTAMP.report.json"
    
    if [ -f "$LIGHTHOUSE_JSON" ]; then
        SCORE=$(node -e "const data = require('./$LIGHTHOUSE_JSON'); console.log(Math.round(data.categories.accessibility.score * 100));")
        echo -e "${GREEN}✓ Lighthouse audit complete${NC}"
        echo "  Score: $SCORE/100"
        echo "  Report: $LIGHTHOUSE_HTML"
    else
        echo -e "${RED}✗ Lighthouse audit failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Lighthouse not installed. Install with: npm install -g lighthouse${NC}"
fi
echo ""

# 2. WAVE Evaluation (using pa11y as alternative)
echo -e "${YELLOW}[2/3] Running WAVE/Pa11y Accessibility Evaluation...${NC}"
if command -v pa11y &> /dev/null; then
    pa11y "$FRONTEND_URL" \
        --reporter html \
        --reporter json \
        --standard WCAG2AA \
        > "$OUTPUT_DIR/pa11y-report-$TIMESTAMP.html" 2>&1 || true
    
    pa11y "$FRONTEND_URL" \
        --reporter json \
        --standard WCAG2AA \
        > "$OUTPUT_DIR/pa11y-report-$TIMESTAMP.json" 2>&1 || true
    
    if [ -f "$OUTPUT_DIR/pa11y-report-$TIMESTAMP.json" ]; then
        echo -e "${GREEN}✓ Pa11y evaluation complete${NC}"
        echo "  Report: $OUTPUT_DIR/pa11y-report-$TIMESTAMP.html"
    else
        echo -e "${RED}✗ Pa11y evaluation failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Pa11y not installed. Install with: npm install -g pa11y${NC}"
    echo "  Or use WAVE browser extension: https://wave.webaim.org/extension/"
fi
echo ""

# 3. Color Contrast Checker (using aXe or manual script)
echo -e "${YELLOW}[3/3] Running Color Contrast Analysis...${NC}"
if command -v axe &> /dev/null; then
    axe "$FRONTEND_URL" \
        --tags wcag2aa \
        --save "$OUTPUT_DIR/axe-contrast-$TIMESTAMP.json" \
        --timeout 30 || true
    
    if [ -f "$OUTPUT_DIR/axe-contrast-$TIMESTAMP.json" ]; then
        echo -e "${GREEN}✓ Contrast analysis complete${NC}"
        echo "  Report: $OUTPUT_DIR/axe-contrast-$TIMESTAMP.json"
    else
        echo -e "${RED}✗ Contrast analysis failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠ aXe CLI not installed. Install with: npm install -g @axe-core/cli${NC}"
    echo "  Manual contrast checking recommended using:"
    echo "  - WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/"
    echo "  - Chrome DevTools Accessibility panel"
fi
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Accessibility Testing Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Reports saved to: $OUTPUT_DIR"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Review Lighthouse report: $LIGHTHOUSE_HTML"
echo "2. Check Pa11y/WAVE results for specific issues"
echo "3. Verify color contrast ratios meet WCAG AA standards"
echo "4. Test with screen readers (NVDA, JAWS, VoiceOver)"
echo "5. Test keyboard navigation throughout the application"
echo ""

