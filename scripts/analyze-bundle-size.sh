#!/bin/bash
# Bundle Size Analysis Script
# Analyzes frontend bundle sizes and provides optimization recommendations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

FRONTEND_DIR="frontend"

echo "📦 Analyzing Bundle Sizes..."
echo ""

cd "$SCRIPT_DIR/.."

if [ ! -d "$FRONTEND_DIR" ]; then
    log_error "Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi

cd "$FRONTEND_DIR"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    log_error "package.json not found in frontend directory"
    exit 1
fi

log_info "Checking for bundle analysis tools..."

# Check if @next/bundle-analyzer or webpack-bundle-analyzer is available
if npm list @next/bundle-analyzer &> /dev/null || npm list webpack-bundle-analyzer &> /dev/null; then
    log_success "Bundle analyzer found"
    echo ""
    echo "To analyze bundle:"
    echo "  npm run build:analyze  # If configured"
    echo "  or"
    echo "  npx webpack-bundle-analyzer build/static/js/*.js"
else
    log_warning "Bundle analyzer not installed"
    echo ""
    echo "Install bundle analyzer:"
    echo "  npm install -D @next/bundle-analyzer"
    echo "  or"
    echo "  npm install -D webpack-bundle-analyzer"
fi

# Check vite-bundle-visualizer for Vite projects
if npm list vite-bundle-visualizer &> /dev/null; then
    log_success "Vite bundle visualizer found"
    echo ""
    echo "To analyze bundle:"
    echo "  npm run build -- --mode analyze"
    echo "  or add to vite.config.ts:"
    echo "    import { visualizer } from 'vite-bundle-visualizer'"
    echo "    plugins: [visualizer()]"
else
    if grep -q "vite" package.json; then
        log_info "Vite project detected"
        echo ""
        echo "Install vite-bundle-visualizer:"
        echo "  npm install -D vite-bundle-visualizer"
    fi
fi

# Analyze node_modules size (if installed)
if [ -d "node_modules" ]; then
    echo ""
    log_info "Analyzing node_modules size..."
    NODE_MODULES_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1 || echo "unknown")
    echo "  node_modules size: $NODE_MODULES_SIZE"
    
    # Find largest packages
    echo ""
    log_info "Top 10 largest packages:"
    du -sh node_modules/* 2>/dev/null | sort -hr | head -10 | while read -r size name; do
        echo "  $size - $(basename "$name")"
    done
fi

# Check for build output
if [ -d "dist" ] || [ -d "build" ]; then
    BUILD_DIR="dist"
    [ -d "build" ] && BUILD_DIR="build"
    
    echo ""
    log_info "Analyzing build output..."
    
    if [ -d "$BUILD_DIR/static/js" ]; then
        echo ""
        echo "JavaScript bundles:"
        find "$BUILD_DIR/static/js" -name "*.js" -type f -exec ls -lh {} \; | \
            awk '{print "  " $5 " - " $9}' | sort -hr | head -10
        
        TOTAL_JS_SIZE=$(find "$BUILD_DIR/static/js" -name "*.js" -type f -exec du -ch {} + | tail -1 | cut -f1)
        echo ""
        echo "  Total JS size: $TOTAL_JS_SIZE"
    fi
    
    if [ -d "$BUILD_DIR/static/css" ]; then
        echo ""
        echo "CSS bundles:"
        find "$BUILD_DIR/static/css" -name "*.css" -type f -exec ls -lh {} \; | \
            awk '{print "  " $5 " - " $9}' | sort -hr | head -10
        
        TOTAL_CSS_SIZE=$(find "$BUILD_DIR/static/css" -name "*.css" -type f -exec du -ch {} + | tail -1 | cut -f1)
        echo ""
        echo "  Total CSS size: $TOTAL_CSS_SIZE"
    fi
else
    log_warning "Build output not found. Run 'npm run build' first."
fi

echo ""
log_info "Optimization Recommendations:"
echo ""
echo "1. Code Splitting:"
echo "   - Use React.lazy() for route-based splitting"
echo "   - Split vendor bundles from app code"
echo "   - Use dynamic imports for heavy components"
echo ""
echo "2. Tree Shaking:"
echo "   - Import only what you need from libraries"
echo "   - Use ES modules when possible"
echo ""
echo "3. Compression:"
echo "   - Enable gzip/brotli compression"
echo "   - Minify JavaScript and CSS"
echo ""
echo "4. Dependencies:"
echo "   - Review large dependencies"
echo "   - Consider lighter alternatives"
echo "   - Remove unused dependencies"

echo ""
log_success "Bundle analysis complete!"

