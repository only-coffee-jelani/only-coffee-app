#!/bin/bash
# Production start script for Only Coffee Backend
# Ensures correct module resolution for monorepo structure

# Set NODE_PATH to help Node find modules
export NODE_PATH=/var/app/current/node_modules:$NODE_PATH

# Change to application directory
cd /var/app/current

# Run the application
exec node services/gateway/dist/services/gateway/src/main.js
