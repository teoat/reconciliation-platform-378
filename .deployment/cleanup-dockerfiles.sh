#!/bin/bash

# ============================================================================
# DOCKERFILE CLEANUP SCRIPT
# ============================================================================
# Removes 14 redundant Dockerfiles while keeping 4 active versions
# Creates backup before deletion for safety

set -e

PROJECT_ROOT="/Users/Arief/Documents/GitHub/reconciliation-platform-378"
BACKUP_FILE="dockerfile-backup-$(date +%Y%m%d-%H%M%S).tar.gz"

cd "$PROJECT_ROOT"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       🧹 DOCKERFILE CLEANUP SCRIPT                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# PHASE 0: CREATE BACKUP
# ============================================================================

echo "📦 Phase 0: Creating Backup"
echo "─────────────────────────────────────────────────────────────────"

tar -czf "$BACKUP_FILE" \
  Dockerfile.backend \
  Dockerfile.backend.optimized \
  Dockerfile.frontend \
  Dockerfile.frontend.optimized \
  Dockerfile.build \
  Dockerfile.rust \
  docker/ \
  infrastructure/docker/ \
  2>/dev/null || true

if [ -f "$BACKUP_FILE" ]; then
  echo "✅ Backup created: $BACKUP_FILE"
  echo "   Size: $(du -h "$BACKUP_FILE" | cut -f1)"
else
  echo "⚠️  Warning: Could not create backup"
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cleanup cancelled"
    exit 1
  fi
fi

echo ""

# ============================================================================
# PHASE 1: ROOT DIRECTORY CLEANUP
# ============================================================================

echo "🗑️  Phase 1: Root Directory Cleanup"
echo "─────────────────────────────────────────────────────────────────"

FILES_TO_DELETE=(
  "Dockerfile.backend"
  "Dockerfile.backend.optimized"
  "Dockerfile.frontend"
  "Dockerfile.frontend.optimized"
  "Dockerfile.build"
  "Dockerfile.rust"
)

for file in "${FILES_TO_DELETE[@]}"; do
  if [ -f "$file" ]; then
    rm -f "$file"
    echo "  ✓ Deleted: $file"
  else
    echo "  ⊘ Not found: $file"
  fi
done

echo ""

# ============================================================================
# PHASE 2: LEGACY DOCKER/ DIRECTORY
# ============================================================================

echo "🗑️  Phase 2: Legacy docker/ Directory"
echo "─────────────────────────────────────────────────────────────────"

if [ -d "docker/postgres" ]; then
  rm -rf docker/postgres
  echo "  ✓ Deleted: docker/postgres/"
fi

if [ -d "docker/redis" ]; then
  rm -rf docker/redis
  echo "  ✓ Deleted: docker/redis/"
fi

# Check if docker/ is empty, if so remove it
if [ -d "docker" ] && [ -z "$(ls -A docker)" ]; then
  rmdir docker
  echo "  ✓ Deleted: docker/ (empty directory)"
fi

echo ""

# ============================================================================
# PHASE 3: INFRASTRUCTURE/DOCKER/ CLEANUP
# ============================================================================

echo "🗑️  Phase 3: infrastructure/docker/ Cleanup"
echo "─────────────────────────────────────────────────────────────────"

cd infrastructure/docker/

OLD_FILES=(
  "Dockerfile.backend"
  "Dockerfile.frontend"
  "Dockerfile.database"
  "Dockerfile.redis"
  "Dockerfile.rust"
  "Dockerfile.frontend.vite"
)

for file in "${OLD_FILES[@]}"; do
  if [ -f "$file" ]; then
    rm -f "$file"
    echo "  ✓ Deleted: $file"
  else
    echo "  ⊘ Not found: $file"
  fi
done

cd "$PROJECT_ROOT"

echo ""

# ============================================================================
# PHASE 4: VERIFICATION
# ============================================================================

echo "✅ Phase 4: Verification"
echo "─────────────────────────────────────────────────────────────────"

echo ""
echo "Remaining Dockerfiles:"
find . -name "Dockerfile*" -type f \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/dist/*" \
  | sort | while read -r file; do
  echo "  ✓ $file"
done

echo ""
echo "Expected files:"
echo "  • infrastructure/docker/Dockerfile.backend.optimized"
echo "  • infrastructure/docker/Dockerfile.backend.fast"
echo "  • infrastructure/docker/Dockerfile.frontend.optimized"
echo "  • infrastructure/docker/Dockerfile.frontend.fast"

echo ""

# ============================================================================
# PHASE 5: DOCKER-COMPOSE VALIDATION
# ============================================================================

echo "🔍 Phase 5: Docker-Compose Validation"
echo "─────────────────────────────────────────────────────────────────"

for compose_file in docker-compose*.yml; do
  if [ -f "$compose_file" ]; then
    echo "Validating $compose_file..."
    if docker-compose -f "$compose_file" config > /dev/null 2>&1; then
      echo "  ✓ $compose_file is valid"
    else
      echo "  ⚠️  $compose_file may have issues"
    fi
  fi
done

echo ""

# ============================================================================
# SUMMARY
# ============================================================================

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       ✅ CLEANUP COMPLETE                                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Summary:"
echo "  • Deleted: 14 redundant Dockerfiles"
echo "  • Kept: 4 active Dockerfiles"
echo "  • Backup: $BACKUP_FILE"
echo ""
echo "📋 Next Steps:"
echo "  1. Verify: docker-compose config"
echo "  2. Test: docker-compose build backend frontend"
echo "  3. Deploy: docker-compose up -d"
echo ""
echo "🔄 To rollback:"
echo "  tar -xzf $BACKUP_FILE"
echo ""

