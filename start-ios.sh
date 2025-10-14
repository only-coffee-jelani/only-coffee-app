#!/bin/bash

echo "📱 Starting Only Coffee iOS App..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "mobile/ios" ]; then
    echo "${RED}Error: mobile/ios directory not found. Please run from project root.${NC}"
    exit 1
fi

# Check if backend is running
echo "${BLUE}🔍 Checking if backend is running...${NC}"
if curl -s http://localhost:3000/api/v1/health > /dev/null 2>&1; then
    echo "${GREEN}✓ Backend is running${NC}"
else
    echo "${YELLOW}⚠️  Warning: Backend doesn't seem to be running${NC}"
    echo "${YELLOW}   Run ./start-backend.sh in another terminal first${NC}"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "${BLUE}🍎 Opening Xcode...${NC}"

cd mobile/ios

# Check if Xcode project exists
if [ ! -d "OnlyCoffee.xcodeproj" ]; then
    echo "${RED}Error: OnlyCoffee.xcodeproj not found${NC}"
    exit 1
fi

# Open Xcode project
open OnlyCoffee.xcodeproj

echo ""
echo "${GREEN}════════════════════════════════════════${NC}"
echo "${GREEN}✨ Xcode Opening...${NC}"
echo "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "Next steps in Xcode:"
echo "  1️⃣  Select your ${BLUE}Team${NC} (Signing & Capabilities)"
echo "  2️⃣  Select ${BLUE}iPhone 15 Pro${NC} simulator"
echo "  3️⃣  Press ${BLUE}⌘R${NC} to build and run"
echo ""
echo "📍 Backend API: ${BLUE}http://localhost:3000/api/v1${NC}"
echo ""
