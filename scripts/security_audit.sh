#!/usr/bin/env bash
set -euo pipefail

echo "[Security Audit] Starting security audits for backend (cargo) and frontend (npm)"

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)

echo "[Security Audit] Backend (Rust)"
pushd "$ROOT_DIR/backend" >/dev/null
if command -v cargo-audit >/dev/null 2>&1; then
  cargo audit || true
else
  echo "cargo-audit not found. Install with: cargo install cargo-audit"
fi
popd >/dev/null

echo "[Security Audit] Frontend (Node)"
pushd "$ROOT_DIR" >/dev/null
if command -v npm >/dev/null 2>&1; then
  npm audit || true
else
  echo "npm not found. Please run npm audit manually after installing Node.js"
fi
popd >/dev/null

echo "[Security Audit] Done"


