#!/usr/bin/env bash
set -euo pipefail

# Simple wrapper to run backend tests and generate coverage reports (XML + HTML)

export DATABASE_URL=${DATABASE_URL:-"postgres://postgres:postgres@localhost:5432/test_db"}
export REDIS_URL=${REDIS_URL:-"redis://localhost:6379"}
export JWT_SECRET=${JWT_SECRET:-"test_secret"}

echo "Running backend tests..."
cargo test --all --verbose

echo "Generating coverage reports (requires cargo-tarpaulin)..."
mkdir -p coverage

if ! command -v cargo-tarpaulin >/dev/null 2>&1 && ! command -v cargo tarpaulin >/dev/null 2>&1; then
  echo "cargo-tarpaulin not found. Install with: cargo install cargo-tarpaulin --locked"
  exit 1
fi

cargo tarpaulin --out Xml --output-dir coverage || echo "Coverage XML generation failed"
cargo tarpaulin --out Html --output-dir coverage || echo "Coverage HTML generation failed"

echo "Coverage reports available in backend/coverage/"

