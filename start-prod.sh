#!/bin/bash
# Production startup - ensure dependencies are installed before running

if [ ! -d "node_modules" ] || [ -z "$(find node_modules -name "vite" -type d)" ]; then
  echo "Installing dependencies..."
  npm install --legacy-peer-deps
  
  if [ -d "dist" ]; then
    echo "Dependencies installed. Starting server..."
  else
    echo "Building application..."
    npm run build
  fi
fi

echo "Starting C.A.R.E.N. server..."
NODE_ENV=production node -r tsx/cjs server/index.ts
