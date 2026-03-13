#!/bin/bash
# Build script that ensures all dependencies are installed before building

set -e

echo "=== Installing all dependencies (production + dev) ==="
npm install --legacy-peer-deps

echo "=== Running build ==="
npm run build

echo "=== Build complete ==="
