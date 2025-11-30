#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

log_info "Starting duplicate code detection with jscpd..."

# Ensure jscpd is installed
if ! command -v jscpd &> /dev/null
then
    log_error "jscpd is not installed. Please install it globally: npm install -g jscpd"
    exit 1
fi

# Run jscpd using the configuration file
jscpd --config .jscpd.json --verbose

if [ $? -eq 0 ]; then
    log_success "Duplicate code check completed successfully. No duplicates found or below threshold."
else
    log_warning "Duplicate code detected! Please review the jscpd report for details."
    log_warning "Check 'diagnostic-results/jscpd-report.md' for detailed markdown report."
    exit 1
fi

# Recommendation for integration:
# You can run this script manually:
# ./scripts/run-duplicate-check.sh
#
# For pre-commit hook integration, you would typically add an entry to your .git/hooks/pre-commit file
# or use a tool like Husky (for JavaScript/TypeScript projects) or a custom Git hook manager.
# Example for .git/hooks/pre-commit:
# #!/bin/sh
# ./scripts/run-duplicate-check.sh
#
# Remember to make the hook executable: chmod +x .git/hooks/pre-commit
