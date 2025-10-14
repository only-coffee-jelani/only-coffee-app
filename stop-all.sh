#!/bin/bash

echo "🛑 Stopping Only Coffee Services..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Stop backend Node.js processes
echo "${BLUE}🛑 Stopping backend services...${NC}"
pkill -f "nest start" 2>/dev/null
pkill -f "node.*gateway" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "${GREEN}✓ Backend stopped${NC}"
else
    echo "${BLUE}ℹ️  No backend processes found${NC}"
fi

# Stop Docker services
echo ""
echo "${BLUE}🛑 Stopping Docker services...${NC}"
docker-compose down

echo ""
echo "${GREEN}════════════════════════════════════════${NC}"
echo "${GREEN}✅ All Services Stopped${NC}"
echo "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "To start again, run: ${BLUE}./start-all.sh${NC}"
echo ""
