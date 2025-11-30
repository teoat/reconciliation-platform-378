#!/bin/bash

# Comprehensive Codebase Diagnostics Script

# Output file for the report
REPORT_FILE="diagnostic-results/comprehensive_diagnostic_report.md"

# --- 1. Code Duplication Detection ---
echo "### 1. Code Duplication Analysis" > $REPORT_FILE
echo "Running JSCPD to detect code duplication..."
export NODE_OPTIONS="--max-old-space-size=8192"
npx jscpd --config .jscpd.json
unset NODE_OPTIONS
if [ -f "diagnostic-results/jscpd-report.md" ]; then
    cat diagnostic-results/jscpd-report.md >> $REPORT_FILE
else
    echo "JSCPD report not found." >> $REPORT_FILE
fi

# --- 2. Unused File Analysis ---
echo -e "\n### 2. Unused File Analysis" >> $REPORT_FILE
echo "Running 'unimported' to find unused files..."
npx unimported --no-interactive | sed 's/\x1b\[[0-9;]*m//g' >> $REPORT_FILE

# --- 3. Configuration Conflict Analysis ---
echo -e "\n### 3. Configuration Conflict Analysis" >> $REPORT_FILE
echo "Analyzing configuration files for potential conflicts..."
# Add specific checks for your project's configuration files
# Example: Check for conflicting port numbers in docker-compose.yml and other configs
grep -r "port:" . --include=\*.{yml,yaml,json} | sort >> $REPORT_FILE

# --- 4. Over-engineering Analysis ---
echo -e "\n### 4. Over-engineering Analysis (Manual Review Required)" >> $REPORT_FILE
echo "The following is a list of files that may be overly complex and warrant a manual review." >> $REPORT_FILE
# Example: Find files with a high number of lines of code (adjust threshold as needed)
find . -type f -name "*.ts" -o -name "*.js" | xargs wc -l | sort -nr | head -n 20 >> $REPORT_FILE

echo -e "\n--- End of Report ---" >> $REPORT_FILE

echo "Comprehensive diagnostic report generated at $REPORT_FILE"
