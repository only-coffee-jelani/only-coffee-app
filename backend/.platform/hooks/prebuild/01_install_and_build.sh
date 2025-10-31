#!/bin/bash
set -e

cd /var/app/staging

echo "Installing production dependencies..."
# Install dependencies including devDependencies at root for workspace hoisting
# Then install workspace dependencies
npm install --legacy-peer-deps
npm install --workspaces --legacy-peer-deps

echo "Verifying pre-built artifacts..."

if [ ! -f "services/gateway/dist/services/gateway/src/main.js" ]; then
  echo "ERROR: Gateway main.js not found!"
  echo "Available files:"
  find services/gateway/dist -type f 2>/dev/null | head -20
  exit 1
fi

if [ ! -d "shared/dist" ]; then
  echo "ERROR: Shared dist directory not found!"
  echo "Available directories:"
  ls -la shared/
  exit 1
fi

echo "Dependencies installed and pre-built artifacts verified successfully!"
