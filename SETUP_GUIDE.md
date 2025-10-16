# Only Coffee - Setup Guide

This guide will help you set up the Only Coffee app development environment from scratch.

## Prerequisites

- **Node.js** v18+ and npm
- **PostgreSQL** 14+
- **Redis** 6+
- **Docker** (optional, for containerized development)
- **Xcode** 14+ (for iOS development)
- **Android Studio** (for Android development)
- **AWS Account** (for S3 and Elastic Beanstalk)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd only-coffee-app-repo
```

### 2. Environment Configuration

Copy the environment template and configure it:

```bash
cp .env.template backend/services/gateway/.env
```

Edit `backend/services/gateway/.env` and replace all `YOUR_*_HERE` placeholders with actual values.

**Critical Variables to Update:**
- `DB_PASSWORD` - Your PostgreSQL password
- `REDIS_PASSWORD` - Your Redis password
- `JWT_SECRET` - Generate with: `openssl rand -base64 64`
- `JWT_REFRESH_SECRET` - Generate with: `openssl rand -base64 64`
- `STRIPE_SECRET_KEY` - From Stripe Dashboard
- `STRIPE_PUBLISHABLE_KEY` - From Stripe Dashboard
- `AWS_ACCESS_KEY_ID` - From AWS IAM
- `AWS_SECRET_ACCESS_KEY` - From AWS IAM

### 3. Database Setup

Create the PostgreSQL database:

```bash
psql -U postgres
CREATE DATABASE only_coffee;
\q
```

Install backend dependencies and run migrations:

```bash
cd backend/services/gateway
npm install
npm run migration:run
```

### 4. Redis Setup

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
```

**Verify Redis is running:**
```bash
redis-cli ping
# Should return: PONG
```

### 5. AWS S3 Setup

1. Create an S3 bucket named `only-coffee-assets`
2. Create a folder structure:
   ```
   only-coffee-assets/
   ├── promotions/
   ├── menu/
   └── stores/
   ```
3. Set bucket policy for public read access (see AWS_S3_SETUP_GUIDE.md)
4. Upload promotion images to the `promotions/` folder

### 6. Start the Backend

```bash
cd backend/services/gateway
npm run start:dev
```

The API will be available at `http://localhost:3000`

### 7. iOS App Setup

1. Open Xcode project:
   ```bash
   cd mobile/ios
   open OnlyCoffee.xcodeproj
   ```

2. Update API endpoint if needed in `APIClient.swift`:
   ```swift
   private let baseURL = "http://localhost:3000/api/v1"
   ```

3. Build and run in Xcode (Cmd+R)

### 8. Android App Setup

1. Open Android Studio and import the project from `android/`

2. Update API endpoint if needed in the network configuration

3. Build and run in Android Studio

## Environment Variables Reference

### Required for Backend

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Backend server port | `3000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `your_secure_password` |
| `DB_DATABASE` | Database name | `only_coffee` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_SECRET` | JWT signing secret | Generate with openssl |
| `JWT_EXPIRES_IN` | Token expiration | `15m` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key | From AWS IAM |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | From AWS IAM |
| `AWS_S3_BUCKET` | S3 bucket name | `only-coffee-assets` |

### Optional Services

| Variable | Description | Required For |
|----------|-------------|--------------|
| `TOAST_CLIENT_ID` | Toast POS client ID | POS integration |
| `TOAST_CLIENT_SECRET` | Toast POS secret | POS integration |
| `EMAIL_USER` | SMTP email | Email notifications |
| `EMAIL_PASSWORD` | SMTP password | Email notifications |
| `TWILIO_ACCOUNT_SID` | Twilio SID | SMS notifications |
| `TWILIO_AUTH_TOKEN` | Twilio token | SMS notifications |

## Generating Secure Secrets

Always generate strong, random secrets for production:

```bash
# JWT Secret
openssl rand -base64 64

# JWT Refresh Secret (use a different value!)
openssl rand -base64 64

# General purpose secret
openssl rand -hex 32
```

## Database Migrations

### Create a new migration:
```bash
cd backend/services/gateway
npm run migration:create -- -n MigrationName
```

### Run migrations:
```bash
npm run migration:run
```

### Revert last migration:
```bash
npm run migration:revert
```

## Development Workflow

### Backend Development
```bash
cd backend/services/gateway
npm run start:dev  # Starts with hot reload
```

### Run Tests
```bash
npm run test        # Unit tests
npm run test:e2e    # E2E tests
npm run test:cov    # Coverage report
```

### Lint and Format
```bash
npm run lint        # Check for issues
npm run format      # Auto-format code
```

## Production Deployment

### Elastic Beanstalk Deployment

1. Install EB CLI:
   ```bash
   pip install awsebcli
   ```

2. Initialize EB:
   ```bash
   cd backend/services/gateway
   eb init
   ```

3. Deploy:
   ```bash
   eb deploy
   ```

### Environment Variables in Production

**IMPORTANT:** Never commit production secrets to git!

Use AWS Secrets Manager or Parameter Store for production secrets:

```bash
aws secretsmanager create-secret \
  --name only-coffee/prod/db-password \
  --secret-string "your_secure_password"
```

Configure Elastic Beanstalk to use secrets:

```bash
eb setenv DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id only-coffee/prod/db-password --query SecretString --output text)
```

## Troubleshooting

### Database Connection Issues

**Error:** `ECONNREFUSED` on database connection

**Solution:**
1. Verify PostgreSQL is running: `pg_isready`
2. Check connection settings in `.env`
3. Ensure database exists: `psql -U postgres -l`

### Redis Connection Issues

**Error:** `Error: Redis connection to localhost:6379 failed`

**Solution:**
1. Start Redis: `redis-server` or `brew services start redis`
2. Verify Redis is accessible: `redis-cli ping`

### Migration Errors

**Error:** `QueryFailedError: relation does not exist`

**Solution:**
1. Run migrations: `npm run migration:run`
2. Check migration files in `backend/shared/src/database/migrations/`

### JWT Secret Not Set

**Error:** `JWT secret not configured`

**Solution:**
1. Generate a secret: `openssl rand -base64 64`
2. Add to `.env`: `JWT_SECRET=<generated_secret>`
3. Restart the server

### iOS Build Errors

**Error:** `Command PhaseScriptExecution failed`

**Solution:**
1. Clean build folder: Xcode → Product → Clean Build Folder
2. Delete derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData`
3. Rebuild: Cmd+B

### Android Build Errors

**Error:** `Gradle sync failed`

**Solution:**
1. Invalidate caches: File → Invalidate Caches / Restart
2. Clean project: Build → Clean Project
3. Rebuild: Build → Rebuild Project

## Support

For issues and questions:
- Check existing GitHub issues
- Create a new issue with detailed error logs
- Include environment details (OS, Node version, etc.)

## Security Notes

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Rotate secrets regularly** - Especially in production
3. **Use strong passwords** - Minimum 32 characters for secrets
4. **Enable 2FA** - On AWS, Stripe, and other service accounts
5. **Limit IAM permissions** - Use principle of least privilege
6. **Monitor logs** - Check for suspicious activity
7. **Keep dependencies updated** - Run `npm audit` regularly

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Stripe API Reference](https://stripe.com/docs/api)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui/)
- [Jetpack Compose Documentation](https://developer.android.com/jetpack/compose)
