#!/bin/bash

# ==============================================================================
# GITIGNORE VERIFICATION SCRIPT
# ==============================================================================
# This script checks for sensitive files that should NOT be committed
# Run this before pushing to ensure no credentials are leaked
# ==============================================================================

echo "🔍 Checking for sensitive files in git repository..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ISSUES_FOUND=0

# Check for .env files
echo "📋 Checking for .env files..."
ENV_FILES=$(git ls-files | grep -E "\.env$|\.env\." | grep -v "\.env\.example\|\.env\.template")
if [ -n "$ENV_FILES" ]; then
    echo -e "${RED}❌ CRITICAL: .env files found in git:${NC}"
    echo "$ENV_FILES"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ No .env files found${NC}"
fi
echo ""

# Check for keys and certificates
echo "📋 Checking for keys and certificates..."
KEY_FILES=$(git ls-files | grep -E "\.(pem|key|crt|jks|keystore|p12|pfx)$")
if [ -n "$KEY_FILES" ]; then
    echo -e "${RED}❌ CRITICAL: Keys/certificates found in git:${NC}"
    echo "$KEY_FILES"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ No keys/certificates found${NC}"
fi
echo ""

# Check for local.properties
echo "📋 Checking for local.properties..."
LOCAL_PROPS=$(git ls-files | grep "local\.properties")
if [ -n "$LOCAL_PROPS" ]; then
    echo -e "${RED}❌ WARNING: local.properties found in git:${NC}"
    echo "$LOCAL_PROPS"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ No local.properties found${NC}"
fi
echo ""

# Check for log files
echo "📋 Checking for log files..."
LOG_FILES=$(git ls-files | grep "\.log$")
if [ -n "$LOG_FILES" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Log files found in git:${NC}"
    echo "$LOG_FILES"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ No log files found${NC}"
fi
echo ""

# Check for AWS credentials
echo "📋 Checking for AWS credentials..."
AWS_CREDS=$(git ls-files | grep -E "aws-credentials|\.aws/")
if [ -n "$AWS_CREDS" ]; then
    echo -e "${RED}❌ CRITICAL: AWS credentials found in git:${NC}"
    echo "$AWS_CREDS"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ No AWS credentials found${NC}"
fi
echo ""

# Check for database backups
echo "📋 Checking for database backups..."
DB_BACKUPS=$(git ls-files | grep -E "\.sql\.backup|\.backup$")
if [ -n "$DB_BACKUPS" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Database backups found in git:${NC}"
    echo "$DB_BACKUPS"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ No database backups found${NC}"
fi
echo ""

# Check for MASTER.env
echo "📋 Checking for MASTER.env..."
MASTER_ENV=$(git ls-files | grep "MASTER\.env")
if [ -n "$MASTER_ENV" ]; then
    echo -e "${RED}❌ CRITICAL: MASTER.env found in git:${NC}"
    echo "$MASTER_ENV"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ No MASTER.env found${NC}"
fi
echo ""

# Summary
echo "============================================================"
if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED - No sensitive files found!${NC}"
    echo "============================================================"
    exit 0
else
    echo -e "${RED}❌ ISSUES FOUND: $ISSUES_FOUND${NC}"
    echo "============================================================"
    echo ""
    echo "⚠️  IMPORTANT: Remove these files before committing!"
    echo ""
    echo "To remove a file from git tracking:"
    echo "  git rm --cached path/to/file"
    echo ""
    echo "To remove from history (if already committed):"
    echo "  1. Rotate the credentials immediately"
    echo "  2. Use BFG Repo-Cleaner or git filter-branch"
    echo "  3. Force push to remote"
    echo ""
    exit 1
fi

