#!/bin/bash
# Script to replace console.log statements with structured logger
# Part of Phase 1.1: Remove Console.log Statements

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

log_info "Starting console.log replacement..."

FRONTEND_DIR="$SCRIPT_DIR/../frontend/src"
LOGGER_IMPORT="import { logger } from '@/services/logger';"

# Files with console.log statements (from grep results)
FILES=(
  "services/visualization/utils/workflowInitializers.ts"
  "components/cashflow/CashflowTable.tsx"
  "hooks/useRealtimeSync.ts"
  "hooks/api/useAuth.ts"
  "hooks/reconciliation/useReconciliationEngine.ts"
  "hooks/useWebSocket.ts"
  "hooks/ingestion/useReconciliationEngine.ts"
  "utils/indonesianDataProcessor.ts"
  "pages/IngestionPage.tsx"
  "services/aiService.ts"
  "hooks/usePerformanceOptimizations.ts"
  "features/registry.ts"
  "utils/pwaUtils.ts"
  "services/retryService.ts"
)

REPLACED_COUNT=0

for file in "${FILES[@]}"; do
  FILE_PATH="$FRONTEND_DIR/$file"
  
  if [ ! -f "$FILE_PATH" ]; then
    log_warning "File not found: $FILE_PATH"
    continue
  fi
  
  log_info "Processing: $file"
  
  # Check if file already imports logger
  if ! grep -q "from '@/services/logger'" "$FILE_PATH" 2>/dev/null; then
    # Add logger import after first import statement
    # Find first import line
    FIRST_IMPORT=$(grep -n "^import" "$FILE_PATH" | head -1 | cut -d: -f1)
    if [ -n "$FIRST_IMPORT" ]; then
      # Insert logger import after first import block
      sed -i.bak "${FIRST_IMPORT}a\\
$LOGGER_IMPORT
" "$FILE_PATH"
      rm -f "${FILE_PATH}.bak"
    fi
  fi
  
  # Replace console.log with logger.info
  sed -i.bak 's/console\.log(/logger.info(/g' "$FILE_PATH"
  
  # Replace console.error with logger.error
  sed -i.bak 's/console\.error(/logger.error(/g' "$FILE_PATH"
  
  # Replace console.warn with logger.warn
  sed -i.bak 's/console\.warn(/logger.warn(/g' "$FILE_PATH"
  
  # Replace console.debug with logger.debug
  sed -i.bak 's/console\.debug(/logger.debug(/g' "$FILE_PATH"
  
  rm -f "${FILE_PATH}.bak"
  
  REPLACED_COUNT=$((REPLACED_COUNT + 1))
  log_success "Processed: $file"
done

log_success "Console.log replacement complete. Processed $REPLACED_COUNT files."
log_info "Please review changes and test before committing."

