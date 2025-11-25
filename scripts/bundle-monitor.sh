#!/bin/bash
# Bundle Monitor Script
# Orchestrates bundle analysis and generates code-splitting-report.json

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Running Bundle Monitor...${NC}"

# Ensure build directory exists
if [ ! -d ".next" ]; then
    echo -e "${YELLOW}⚠️  Build directory (.next) not found. Running 'npm run build' first.${NC}"
    ANALYZE=true npm run build
fi

echo -e "${GREEN}✅ Build completed.${NC}"

echo -e "${BLUE}📊 Analyzing code splitting...${NC}"
node scripts/analyze-code-splitting.js --analyze

echo -e "${GREEN}✅ Code splitting analysis complete. Report generated: code-splitting-report.json${NC}"

# Optional: Add logic for baseline comparison if needed
# if [[ "$1" == "--baseline" ]]; then
#     echo -e "${BLUE}Setting bundle baseline...${NC}"
#     # Logic to copy current report to a baseline file
#     cp code-splitting-report.json .bundle-baseline.json
#     echo -e "${GREEN}✅ Bundle baseline set.${NC}"
# fi

echo -e "${BLUE}📦 Bundle Monitor Finished.${NC}"
