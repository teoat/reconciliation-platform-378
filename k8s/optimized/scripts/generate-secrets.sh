#!/bin/bash
# Generate all required secrets for initial setup
# Usage: ./generate-secrets.sh [output-file]

set -e

OUTPUT_FILE=${1:-secrets-generated.txt}

echo "Generating secure secrets..."
echo ""

# Generate secrets
JWT_SECRET=$(openssl rand -base64 48)
JWT_REFRESH_SECRET=$(openssl rand -base64 48)
CSRF_SECRET=$(openssl rand -base64 48)
POSTGRES_PASSWORD=$(openssl rand -base64 24)
PASSWORD_MASTER_KEY=$(openssl rand -base64 48)
BACKUP_ENCRYPTION_KEY=$(openssl rand -base64 48)

# Build DATABASE_URL
DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD}@postgres-service:5432/reconciliation?sslmode=disable"

# Write to file
cat > "$OUTPUT_FILE" << EOF
# Generated Secrets for Reconciliation Platform
# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# 
# ⚠️  IMPORTANT: Keep this file secure and never commit to version control!
# 
# To use these secrets:
# 1. Copy values to Kubernetes secrets:
#    kubectl create secret generic reconciliation-secrets \\
#      --from-literal=JWT_SECRET='${JWT_SECRET}' \\
#      --from-literal=JWT_REFRESH_SECRET='${JWT_REFRESH_SECRET}' \\
#      --from-literal=CSRF_SECRET='${CSRF_SECRET}' \\
#      --from-literal=DATABASE_URL='${DATABASE_URL}' \\
#      --from-literal=POSTGRES_PASSWORD='${POSTGRES_PASSWORD}' \\
#      --from-literal=PASSWORD_MASTER_KEY='${PASSWORD_MASTER_KEY}' \\
#      --from-literal=BACKUP_ENCRYPTION_KEY='${BACKUP_ENCRYPTION_KEY}' \\
#      -n reconciliation-platform
#
# 2. Or use the management script:
#    ./manage-secrets.sh create
#
# 3. Delete this file after use:
#    rm ${OUTPUT_FILE}

JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
CSRF_SECRET=${CSRF_SECRET}
DATABASE_URL=${DATABASE_URL}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
PASSWORD_MASTER_KEY=${PASSWORD_MASTER_KEY}
BACKUP_ENCRYPTION_KEY=${BACKUP_ENCRYPTION_KEY}

EOF

echo "✓ Secrets generated and saved to: $OUTPUT_FILE"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Keep this file secure"
echo "   - Never commit to version control"
echo "   - Delete after use"
echo ""
echo "To create Kubernetes secrets, run:"
echo "  ./manage-secrets.sh create"
echo ""
echo "Or manually:"
echo "  kubectl create secret generic reconciliation-secrets \\"
echo "    --from-literal=JWT_SECRET='${JWT_SECRET}' \\"
echo "    --from-literal=CSRF_SECRET='${CSRF_SECRET}' \\"
echo "    --from-literal=POSTGRES_PASSWORD='${POSTGRES_PASSWORD}' \\"
echo "    --from-literal=PASSWORD_MASTER_KEY='${PASSWORD_MASTER_KEY}' \\"
echo "    -n reconciliation-platform"


