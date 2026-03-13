#!/bin/bash
# Production build optimization script

set -e

echo "=== C.A.R.E.N. Production Build Optimization ==="

# Clean cache and temporary files
echo "Cleaning TypeScript cache..."
rm -rf .cache

# Build frontend with optimized settings
echo "Building frontend..."
npm run build

# Remove source maps from production build
echo "Removing source maps..."
find dist -name "*.map" -type f -delete 2>/dev/null || true

# Remove source maps from node_modules (if they exist)
echo "Cleaning up node_modules..."
find node_modules -name "*.map" -type f -delete 2>/dev/null || true

# Remove unnecessary directories
rm -rf node_modules/.bin node_modules/.cache

echo "=== Build optimization complete ==="
ls -lh dist/public/index-* 2>/dev/null | head -1
du -sh dist 2>/dev/null || echo "dist built successfully"
