#!/bin/bash
set -e

echo "🗄️  Running Database Migrations"
echo "==============================="

# Load production environment
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

echo "Database: $DB_DATABASE"
echo "Host: $DB_HOST"

# Run migrations
npm run typeorm -- migration:run -d shared/src/database/data-source.ts

echo "✅ Migrations completed successfully!"
