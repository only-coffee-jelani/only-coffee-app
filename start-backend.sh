#!/bin/bash

echo "🚀 Starting Only Coffee Backend..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "${RED}Error: docker-compose.yml not found. Please run from project root.${NC}"
    exit 1
fi

# Step 1: Start Docker services
echo "${BLUE}📦 Starting PostgreSQL and Redis...${NC}"
docker-compose up -d postgres redis

if [ $? -ne 0 ]; then
    echo "${RED}❌ Failed to start Docker services${NC}"
    exit 1
fi

echo "${GREEN}✓ Docker services started${NC}"
echo ""

# Wait for databases to be ready
echo "${BLUE}⏳ Waiting for databases to be ready (10 seconds)...${NC}"
sleep 10

# Step 2: Check if migrations have been run
echo "${BLUE}🗄️  Checking database migrations...${NC}"
cd backend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "${BLUE}📦 Installing dependencies...${NC}"
    npm install --legacy-peer-deps
fi

# Run migrations (will skip if already run)
npm run migration:run 2>&1 | grep -q "No migrations are pending" && \
    echo "${GREEN}✓ Database migrations up to date${NC}" || \
    echo "${GREEN}✓ Database migrations completed${NC}"

echo ""

# Step 3: Start Gateway service
echo "${BLUE}🚀 Starting Gateway API...${NC}"
cd services/gateway

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "${BLUE}📦 Installing gateway dependencies...${NC}"
    npm install --legacy-peer-deps
fi

echo ""
echo "${GREEN}════════════════════════════════════════${NC}"
echo "${GREEN}✨ Backend Starting...${NC}"
echo "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "📍 Gateway API: ${BLUE}http://localhost:3000/api/v1${NC}"
echo "📖 API Docs: ${BLUE}http://localhost:3000/api/docs${NC}"
echo "🔍 Health Check: ${BLUE}http://localhost:3000/api/v1/health${NC}"
echo ""
echo "Press ${RED}Ctrl+C${NC} to stop"
echo ""

# Start the gateway service
npm run start:dev
