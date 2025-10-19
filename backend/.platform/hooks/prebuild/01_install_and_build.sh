#!/bin/bash
set -e

cd /var/app/staging

echo "Installing production dependencies..."
# Install only production dependencies (no building needed, using pre-built artifacts)
npm install --omit=dev --legacy-peer-deps
npm install --omit=dev --workspaces --legacy-peer-deps

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
