#!/bin/bash
set -e

cd /var/app/staging

echo "Installing production dependencies..."
# Install dependencies at root AND in workspaces (production only)
npm install --omit=dev
npm install --omit=dev --workspaces

echo "Verifying pre-built artifacts..."

if [ ! -f "services/gateway/dist/services/gateway/src/main.js" ]; then
  echo "ERROR: Gateway main.js not found!"
  echo "Available files:"
  find services/gateway/dist -type f | head -20
  exit 1
fi

if [ ! -d "shared/dist" ]; then
  echo "ERROR: Shared dist directory not found!"
  echo "Available directories:"
  ls -la shared/
  exit 1
fi

echo "Dependencies installed and pre-built artifacts verified successfully!"
