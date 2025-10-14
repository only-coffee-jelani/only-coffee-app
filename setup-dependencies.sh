#!/bin/bash

echo "🔧 Only Coffee - Dependency Setup"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "${RED}❌ This script is designed for macOS${NC}"
    echo "For other operating systems, please install Docker Desktop manually:"
    echo "https://docs.docker.com/get-docker/"
    exit 1
fi

echo "${BLUE}════════════════════════════════════════${NC}"
echo "${BLUE}  Checking Dependencies${NC}"
echo "${BLUE}════════════════════════════════════════${NC}"
echo ""

# Check Homebrew
echo "${BLUE}🍺 Checking Homebrew...${NC}"
if command -v brew &> /dev/null; then
    echo "${GREEN}✓ Homebrew is installed${NC}"
    BREW_VERSION=$(brew --version | head -n 1)
    echo "  Version: $BREW_VERSION"
else
    echo "${RED}✗ Homebrew is not installed${NC}"
    echo ""
    echo "${YELLOW}Installing Homebrew...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    if [ $? -eq 0 ]; then
        echo "${GREEN}✓ Homebrew installed successfully${NC}"
    else
        echo "${RED}❌ Failed to install Homebrew${NC}"
        exit 1
    fi
fi

echo ""

# Check Node.js
echo "${BLUE}📦 Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "${GREEN}✓ Node.js is installed${NC}"
    echo "  Version: $NODE_VERSION"

    # Check version
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$MAJOR_VERSION" -lt 20 ]; then
        echo "${YELLOW}⚠️  Warning: Node.js 20 LTS or higher is recommended${NC}"
        echo "  Current version: $NODE_VERSION"
        echo ""
        read -p "Install Node.js 20 LTS? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "${YELLOW}Installing Node.js 20 LTS...${NC}"
            brew install node@20
            brew link --overwrite node@20
        fi
    fi
else
    echo "${RED}✗ Node.js is not installed${NC}"
    echo ""
    echo "${YELLOW}Installing Node.js 20 LTS...${NC}"
    brew install node@20

    if [ $? -eq 0 ]; then
        echo "${GREEN}✓ Node.js installed successfully${NC}"
    else
        echo "${RED}❌ Failed to install Node.js${NC}"
        exit 1
    fi
fi

echo ""

# Check Docker
echo "${BLUE}🐳 Checking Docker...${NC}"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo "${GREEN}✓ Docker is installed${NC}"
    echo "  Version: $DOCKER_VERSION"

    # Check if Docker daemon is running
    if docker info &> /dev/null; then
        echo "${GREEN}✓ Docker daemon is running${NC}"
    else
        echo "${YELLOW}⚠️  Docker is installed but not running${NC}"
        echo ""
        echo "Please start Docker Desktop:"
        echo "  1. Open Spotlight (⌘ + Space)"
        echo "  2. Type 'Docker'"
        echo "  3. Press Enter to launch Docker Desktop"
        echo "  4. Wait for Docker to start (icon in menu bar)"
        echo ""
        read -p "Press Enter once Docker Desktop is running..."

        # Wait for Docker to be ready
        echo "${BLUE}Waiting for Docker daemon...${NC}"
        for i in {1..30}; do
            if docker info &> /dev/null; then
                echo "${GREEN}✓ Docker daemon is now running${NC}"
                break
            fi
            sleep 2
        done
    fi
else
    echo "${RED}✗ Docker is not installed${NC}"
    echo ""
    echo "${YELLOW}Docker Desktop is required for Only Coffee${NC}"
    echo ""
    echo "Choose installation method:"
    echo "  1. Install via Homebrew (recommended)"
    echo "  2. Download manually from Docker website"
    echo ""
    read -p "Enter choice (1 or 2): " -n 1 -r
    echo

    if [[ $REPLY == "1" ]]; then
        echo "${YELLOW}Installing Docker Desktop via Homebrew...${NC}"
        brew install --cask docker

        if [ $? -eq 0 ]; then
            echo "${GREEN}✓ Docker Desktop installed successfully${NC}"
            echo ""
            echo "${YELLOW}Please launch Docker Desktop to complete setup:${NC}"
            echo "  1. Open Spotlight (⌘ + Space)"
            echo "  2. Type 'Docker'"
            echo "  3. Press Enter"
            echo "  4. Follow the setup wizard"
            echo ""

            # Try to open Docker Desktop
            open -a Docker

            echo "Waiting for Docker Desktop to start..."
            read -p "Press Enter once Docker Desktop is running..."
        else
            echo "${RED}❌ Failed to install Docker Desktop${NC}"
            exit 1
        fi
    else
        echo ""
        echo "${BLUE}Please download Docker Desktop manually:${NC}"
        echo "  1. Visit: https://www.docker.com/products/docker-desktop"
        echo "  2. Download for macOS (Apple Silicon or Intel)"
        echo "  3. Install and launch Docker Desktop"
        echo "  4. Run this script again after installation"
        echo ""
        exit 0
    fi
fi

echo ""

# Check Xcode
echo "${BLUE}🍎 Checking Xcode...${NC}"
if command -v xcodebuild &> /dev/null; then
    XCODE_VERSION=$(xcodebuild -version | head -n 1)
    echo "${GREEN}✓ Xcode is installed${NC}"
    echo "  Version: $XCODE_VERSION"
else
    echo "${YELLOW}⚠️  Xcode is not installed${NC}"
    echo ""
    echo "Xcode is required for iOS development."
    echo "Install from the Mac App Store:"
    echo "  https://apps.apple.com/us/app/xcode/id497799835"
    echo ""
fi

echo ""
echo "${BLUE}════════════════════════════════════════${NC}"
echo "${BLUE}  Installing Project Dependencies${NC}"
echo "${BLUE}════════════════════════════════════════${NC}"
echo ""

# Install backend dependencies
echo "${BLUE}📦 Installing backend dependencies...${NC}"
cd backend

if [ ! -d "node_modules" ]; then
    echo "Running npm install (this may take a few minutes)..."
    npm install --legacy-peer-deps

    if [ $? -eq 0 ]; then
        echo "${GREEN}✓ Backend dependencies installed${NC}"
    else
        echo "${RED}❌ Failed to install backend dependencies${NC}"
        exit 1
    fi
else
    echo "${GREEN}✓ Backend dependencies already installed${NC}"
fi

echo ""

# Install gateway dependencies
echo "${BLUE}📦 Installing gateway dependencies...${NC}"
cd services/gateway

if [ ! -d "node_modules" ]; then
    echo "Running npm install..."
    npm install --legacy-peer-deps

    if [ $? -eq 0 ]; then
        echo "${GREEN}✓ Gateway dependencies installed${NC}"
    else
        echo "${RED}❌ Failed to install gateway dependencies${NC}"
        exit 1
    fi
else
    echo "${GREEN}✓ Gateway dependencies already installed${NC}"
fi

cd ../../..

echo ""
echo "${GREEN}════════════════════════════════════════${NC}"
echo "${GREEN}✅ All Dependencies Installed!${NC}"
echo "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "${BLUE}Summary:${NC}"
echo "  ✓ Homebrew"
echo "  ✓ Node.js $(node --version)"
echo "  ✓ Docker $(docker --version 2>/dev/null | awk '{print $3}' | sed 's/,//')"
echo "  ✓ Backend dependencies"
echo "  ✓ Gateway dependencies"

if command -v xcodebuild &> /dev/null; then
    echo "  ✓ Xcode"
fi

echo ""
echo "${GREEN}Next Steps:${NC}"
echo "  1. Make sure Docker Desktop is running"
echo "  2. Run: ${BLUE}./start-all.sh${NC}"
echo "  3. Wait for services to start"
echo "  4. Build and run the iOS app in Xcode"
echo ""
echo "${YELLOW}First time setup?${NC}"
echo "  Read: ${BLUE}QUICK_START.md${NC}"
echo ""
