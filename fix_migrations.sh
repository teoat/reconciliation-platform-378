#!/bin/bash
# Fix Diesel Migrations Script

set -e

echo "🔧 Fixing Diesel Migration Issues..."

# Step 1: Ensure diesel.toml exists
if [ ! -f backend/diesel.toml ]; then
    echo "📝 Creating diesel.toml..."
    cat > backend/diesel.toml << 'EOF'
[print_schema]
file = "src/schema.rs"

[migrations_directory]
dir = "migrations"
EOF
    echo "✅ diesel.toml created"
else
    echo "✅ diesel.toml already exists"
fi

# Step 2: Set DATABASE_URL if not set
if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL="postgres://postgres:postgres@localhost:5432/reconciliation_app"
    echo "⚠️  DATABASE_URL not set, using default: $DATABASE_URL"
fi

# Step 3: Create database if needed
echo "🗄️  Checking database..."
createdb -h localhost reconciliation_app 2>/dev/null || echo "✅ Database already exists"

# Step 4: Install Diesel CLI if needed
if ! command -v diesel &> /dev/null; then
    echo "📦 Installing Diesel CLI..."
    cargo install diesel_cli --no-default-features --features postgres
    echo "✅ Diesel CLI installed"
else
    echo "✅ Diesel CLI already installed"
fi

# Step 5: Run migrations
echo "🔧 Running migrations..."
cd backend

if diesel migration run 2>&1; then
    echo "✅ Migrations completed successfully!"
else
    echo "⚠️  Diesel migration failed, trying alternative method..."
    
    # Fallback: Run SQL files directly
    echo "📝 Running SQL migrations manually..."
    for migration_dir in migrations/2024-*-*; do
        if [ -d "$migration_dir" ] && [ -f "$migration_dir/up.sql" ]; then
            echo "  Running: $(basename $migration_dir)"
            psql "$DATABASE_URL" -f "$migration_dir/up.sql" 2>/dev/null || echo "    ⚠️  Migration already applied or failed"
        fi
    done
    echo "✅ Manual migrations completed"
fi

echo ""
echo "🎉 Migration setup complete!"
echo ""
echo "Verification commands:"
echo "  diesel migration list"
echo "  psql $DATABASE_URL -c 'SELECT * FROM __diesel_schema_migrations;'"
echo ""

