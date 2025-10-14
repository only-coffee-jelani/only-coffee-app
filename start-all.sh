#!/bin/bash

echo "🚀 Starting Only Coffee - Full Stack"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "${RED}Error: docker-compose.yml not found. Please run from project root.${NC}"
    exit 1
fi

echo "${BLUE}════════════════════════════════════════${NC}"
echo "${BLUE}  Only Coffee - Full Stack Startup${NC}"
echo "${BLUE}════════════════════════════════════════${NC}"
echo ""

# Step 1: Start Docker services
echo "${BLUE}📦 Step 1/3: Starting Docker services...${NC}"
docker-compose up -d postgres redis pgadmin redis-commander

if [ $? -ne 0 ]; then
    echo "${RED}❌ Failed to start Docker services${NC}"
    exit 1
fi

echo "${GREEN}✓ Docker services started${NC}"
echo ""

# Wait for databases
echo "${BLUE}⏳ Waiting for databases (15 seconds)...${NC}"
sleep 15

# Step 2: Setup and start backend
echo "${BLUE}🗄️  Step 2/3: Setting up backend...${NC}"
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "${BLUE}📦 Installing dependencies...${NC}"
    npm install --legacy-peer-deps
fi

# Run migrations
npm run migration:run

echo "${GREEN}✓ Backend setup complete${NC}"
echo ""

# Step 3: Start everything
echo "${BLUE}🚀 Step 3/3: Starting services...${NC}"
echo ""

# Start backend in background
cd services/gateway
npm run start:dev > ../../../backend.log 2>&1 &
BACKEND_PID=$!

# Wait a few seconds for backend to start
echo "${BLUE}⏳ Waiting for backend to start...${NC}"
sleep 10

# Check if backend started successfully
if curl -s http://localhost:3000/api/v1/health > /dev/null 2>&1; then
    echo "${GREEN}✓ Backend is running${NC}"
else
    echo "${YELLOW}⚠️  Backend may still be starting...${NC}"
fi

echo ""
echo "${GREEN}════════════════════════════════════════${NC}"
echo "${GREEN}✨ Services Started!${NC}"
echo "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "${BLUE}Backend Services:${NC}"
echo "  📍 Gateway API:      http://localhost:3000/api/v1"
echo "  📖 API Docs:         http://localhost:3000/api/docs"
echo "  🔍 Health Check:     http://localhost:3000/api/v1/health"
echo "  🗄️  PostgreSQL:       localhost:5432"
echo "  📮 Redis:            localhost:6379"
echo "  🎛️  pgAdmin:          http://localhost:5050"
echo "  📊 Redis Commander:  http://localhost:8081"
echo ""
echo "${BLUE}Logs:${NC}"
echo "  📝 Backend log: tail -f backend.log"
echo ""
echo "${YELLOW}Opening iOS app in Xcode...${NC}"
echo ""

# Open iOS app
cd ../../..
./start-ios.sh

echo ""
echo "${GREEN}To stop all services:${NC}"
echo "  1. Stop backend: kill $BACKEND_PID"
echo "  2. Stop Docker: docker-compose down"
echo "  3. Or run: ./stop-all.sh"
echo ""
