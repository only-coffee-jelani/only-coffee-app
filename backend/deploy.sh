#!/bin/bash
set -e

echo "🚀 Only Coffee Backend Deployment Script"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if EB CLI is installed
if ! command -v eb &> /dev/null; then
    echo -e "${RED}Error: EB CLI is not installed${NC}"
    echo "Install it with: pip install awsebcli --upgrade --user"
    exit 1
fi

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from backend directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm ci

echo -e "${YELLOW}Step 2: Running tests...${NC}"
npm test || echo -e "${YELLOW}Warning: Tests failed or not configured${NC}"

echo -e "${YELLOW}Step 3: Building application...${NC}"
npm run build

echo -e "${YELLOW}Step 4: Checking EB environment...${NC}"
eb status || {
    echo -e "${RED}Error: No EB environment configured${NC}"
    echo "Run 'eb init' first to initialize Elastic Beanstalk"
    exit 1
}

echo -e "${YELLOW}Step 5: Deploying to Elastic Beanstalk...${NC}"
eb deploy

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Check status with: eb status"
echo "View logs with: eb logs"
echo "Open app with: eb open"
