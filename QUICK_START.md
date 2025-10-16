# Only Coffee - Quick Start Guide

Get up and running in 10 minutes!

## Prerequisites Checklist

- [ ] Node.js v18+ installed
- [ ] PostgreSQL 14+ installed and running
- [ ] Redis 6+ installed and running
- [ ] AWS account with S3 access
- [ ] Stripe account (test mode is fine)

## Step-by-Step Setup

### 1️⃣ Environment Configuration (2 min)

```bash
# Copy environment template
cp .env.template backend/services/gateway/.env

# Edit the file and replace these critical values:
# - DB_PASSWORD (your PostgreSQL password)
# - REDIS_PASSWORD (your Redis password)
# - JWT_SECRET (generate: openssl rand -base64 64)
# - JWT_REFRESH_SECRET (generate: openssl rand -base64 64)
# - STRIPE_SECRET_KEY (from Stripe dashboard)
# - AWS_ACCESS_KEY_ID (from AWS IAM)
# - AWS_SECRET_ACCESS_KEY (from AWS IAM)
```

### 2️⃣ Database Setup (2 min)

```bash
# Create database
psql -U postgres -c "CREATE DATABASE only_coffee;"

# Install dependencies and run migrations
cd backend/services/gateway
npm install
npm run migration:run
```

### 3️⃣ Start Backend (1 min)

```bash
cd backend/services/gateway
npm run start:dev
```

Server will be running at `http://localhost:3000`

### 4️⃣ iOS App (2 min)

```bash
cd mobile/ios
open OnlyCoffee.xcodeproj
# Press Cmd+R to build and run
```

### 5️⃣ Android App (2 min)

1. Open Android Studio
2. Import project from `android/` folder
3. Click Run ▶️

## Verify Setup

Test the API:
```bash
curl http://localhost:3000/api/v1/health
# Should return: {"status":"ok"}
```

## Common Issues & Quick Fixes

### PostgreSQL not running
```bash
# macOS
brew services start postgresql@14

# Linux
sudo systemctl start postgresql
```

### Redis not running
```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis-server
```

### Port 3000 already in use
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or change PORT in .env
echo "PORT=3001" >> backend/services/gateway/.env
```

### Database connection failed
```bash
# Verify PostgreSQL is accessible
psql -U postgres -c "SELECT version();"

# Check .env has correct DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD
```

### JWT secret not set
```bash
# Generate a secret and add to .env
echo "JWT_SECRET=$(openssl rand -base64 64)" >> backend/services/gateway/.env
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 64)" >> backend/services/gateway/.env
```

## Essential Commands

### Backend
```bash
npm run start:dev      # Start development server
npm run test          # Run tests
npm run migration:run # Run database migrations
npm run lint          # Check code style
```

### Database
```bash
npm run migration:create -- -n MigrationName  # Create migration
npm run migration:run                         # Run migrations
npm run migration:revert                      # Rollback last migration
```

## What's Next?

1. Read `SETUP_GUIDE.md` for detailed documentation
2. Check `AWS_S3_SETUP_GUIDE.md` for S3 configuration
3. Review `.env.template` comments for all configuration options
4. Join the team Slack/Discord for support

## Need Help?

- 📖 Full docs: See `SETUP_GUIDE.md`
- 🐛 Found a bug: Create a GitHub issue
- 💬 Questions: Contact the team

## Production Deployment

**Not ready for production?** Follow `SETUP_GUIDE.md` for production deployment instructions.

**Ready for production?** Make sure to:
- [ ] Set `NODE_ENV=production`
- [ ] Use production Stripe keys
- [ ] Use strong JWT secrets
- [ ] Enable SSL for database
- [ ] Set `DB_SYNCHRONIZE=false`
- [ ] Configure AWS Elastic Beanstalk
- [ ] Set up monitoring and logging

---

🎉 **Happy Coding!** Welcome to the Only Coffee team!
