#!/bin/bash
# Quick execution helper

echo "╔═══════════════════════════════════════════════════════╗"
echo "║  Better Auth - Quick Execution Helper                ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "Choose an option:"
echo ""
echo "1) Run interactive setup (RECOMMENDED)"
echo "2) Show manual commands"
echo "3) Validate implementation only"
echo "4) Exit"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo ""
        echo "Running interactive setup..."
        ./scripts/execute-next-steps.sh
        ;;
    2)
        echo ""
        echo "=== Manual Setup Commands ==="
        echo ""
        echo "Terminal 1 - Auth Server:"
        echo "  cd auth-server/"
        echo "  npm install"
        echo "  cp .env.example .env"
        echo "  # Edit .env: Set DATABASE_URL and generate JWT_SECRET"
        echo "  npm run dev"
        echo ""
        echo "Terminal 2 - Backend:"
        echo "  cd backend/"
        echo "  # Add to .env: AUTH_SERVER_URL, BETTER_AUTH_JWT_SECRET, ENABLE_DUAL_AUTH=true"
        echo "  cargo run"
        echo ""
        echo "Terminal 3 - Frontend:"
        echo "  cd frontend/"
        echo "  # Create .env.local with VITE_ENABLE_BETTER_AUTH=true"
        echo "  npm run dev"
        echo ""
        echo "Then open: http://localhost:5173"
        echo ""
        ;;
    3)
        echo ""
        echo "Running validation..."
        ./scripts/validate-better-auth-implementation.sh
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
