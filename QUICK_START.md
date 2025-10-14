# Only Coffee - Quick Start Guide

Get the Only Coffee full stack app up and running in 5 minutes!

## Prerequisites

Ensure you have the following installed:
- **Node.js 20 LTS** - [Download](https://nodejs.org/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
- **Xcode 15.0+** - For iOS development (macOS only)

## 🚀 One-Command Startup (Recommended)

From the project root, run:

```bash
./start-all.sh
```

This will:
1. Start Docker services (PostgreSQL, Redis, pgAdmin, Redis Commander)
2. Install dependencies if needed
3. Run database migrations
4. Start the Gateway API
5. Open the iOS app in Xcode

**That's it!** Your full stack is now running.

---

## 📋 Alternative: Step-by-Step Manual Setup

### Step 1: Clone and Setup

```bash
# Navigate to the project
cd only-coffee-app-repo

# Install all dependencies (this may take a few minutes)
cd backend
npm install
```

### Step 2: Start Database Services

```bash
# Start PostgreSQL 16.4 and Redis 8.2 with Docker
docker-compose up -d postgres redis

# Verify services are running
docker ps
```

You should see:
- `only-coffee-postgres` on port 5432
- `only-coffee-redis` on port 6379

### Step 3: Run Database Migrations

```bash
# Run migrations to create all tables
npm run migration:run
```

This creates:
- 9 core tables (users, stores, orders, etc.)
- Proper indexes and foreign keys
- Monthly partitions for orders and rewards
- All database constraints

### Step 4: Start the Gateway API

```bash
# Navigate to the Gateway service
cd services/gateway

# Start in development mode with hot reload
npm run start:dev
```

The API will start on **http://localhost:3000**

### Step 5: Open iOS App

```bash
# From project root
./start-ios.sh
```

Or manually:
```bash
cd mobile/ios
open OnlyCoffee.xcodeproj
```

Then in Xcode:
1. Select your Team (Signing & Capabilities)
2. Select iPhone 15 Pro simulator
3. Press ⌘R to build and run

---

## 🛠️ Startup Scripts Reference

### Full Stack
```bash
./start-all.sh      # Start everything (Docker + Backend + iOS)
./stop-all.sh       # Stop all services cleanly
```

### Backend Only
```bash
./start-backend.sh  # Start Docker + Backend API only
```

### iOS Only
```bash
./start-ios.sh      # Open iOS app in Xcode (checks backend status)
```

---

## ✅ Test the API

### Health Check
```bash
curl http://localhost:3000/api/v1/health
```

### View API Documentation
Open your browser: **http://localhost:3000/api/docs**

### Register a User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

Save the `accessToken` from the response.

### Get User Profile
```bash
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Optional: Database Admin Tools

### pgAdmin (PostgreSQL GUI)
```bash
# Start pgAdmin
docker-compose up -d pgadmin

# Access at: http://localhost:5050
# Login: admin@onlycoffee.com / admin
```

### Redis Commander (Redis GUI)
```bash
# Start Redis Commander
docker-compose up -d redis-commander

# Access at: http://localhost:8081
```

## 🌐 Service URLs

Once started, these services are available:

| Service | URL | Description |
|---------|-----|-------------|
| Gateway API | http://localhost:3000/api/v1 | Main REST API |
| API Docs | http://localhost:3000/api/docs | Swagger UI |
| Health Check | http://localhost:3000/api/v1/health | API status |
| pgAdmin | http://localhost:5050 | PostgreSQL GUI (admin@onlycoffee.com / admin) |
| Redis Commander | http://localhost:8081 | Redis GUI |

## 📡 Available API Endpoints (53 total)

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/register` | Register new user | No |
| POST | `/api/v1/auth/login` | Login user | No |
| POST | `/api/v1/auth/refresh` | Refresh token | No |

### Users
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/users/me` | Get profile | Yes |
| PUT | `/api/v1/users/me` | Update profile | Yes |
| GET | `/api/v1/users/me/loyalty` | Get loyalty info | Yes |

### Stores
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/stores/nearby` | Find nearby stores | No |
| GET | `/api/v1/stores/:id` | Get store details | No |
| GET | `/api/v1/stores/:id/menu` | Get store menu | No |

### Orders
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/orders` | Create order | Yes |
| GET | `/api/v1/orders` | Get user orders | Yes |
| GET | `/api/v1/orders/:id` | Get order details | Yes |
| POST | `/api/v1/orders/:id/confirm` | Confirm payment | Yes |

### Gift Cards
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/gifts` | Create gift card | Yes |
| POST | `/api/v1/gifts/redeem` | Redeem gift card | Yes |
| GET | `/api/v1/gifts/balance/:code` | Check balance | No |

### Reviews
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/reviews` | Create review | Yes |
| GET | `/api/v1/reviews/store/:id` | Get store reviews | No |
| GET | `/api/v1/reviews/store/:id/stats` | Get review stats | No |

### Rewards
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/rewards/balance` | Get points balance | Yes |
| GET | `/api/v1/rewards/transactions` | Get transaction history | Yes |
| POST | `/api/v1/rewards/redeem/:id` | Redeem reward | Yes |

### Health
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/health` | Health check | No |

**Full API documentation**: http://localhost:3000/api/docs

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View PostgreSQL logs
docker logs only-coffee-postgres
```

### Redis Connection Error
```bash
# Check if Redis is running
docker ps | grep redis

# View Redis logs
docker logs only-coffee-redis
```

### Migration Errors
```bash
# Revert last migration
npm run migration:revert

# Re-run migration
npm run migration:run
```

## Development Commands

```bash
# Backend root
npm run lint              # Lint all code
npm run format            # Format code
npm test                  # Run tests
npm run build             # Build all services

# Gateway service
npm run start:dev         # Development with hot reload
npm run start:debug       # Debug mode
npm run build             # Production build
npm run start:prod        # Production mode
```

## Environment Variables

The Gateway service uses these key environment variables (see `backend/services/gateway/.env`):

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=only_coffee

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
```

## 📱 iOS App Setup

See detailed iOS setup instructions: `mobile/ios/SETUP.md`

### Quick iOS Checklist
1. Open project: `./start-ios.sh` or `open mobile/ios/OnlyCoffee.xcodeproj`
2. Select your Team in Signing & Capabilities
3. Select iPhone 15 Pro simulator
4. Press ⌘R to build and run

### iOS Features
- SwiftUI with MVVM architecture
- 28 Swift files with full functionality
- Authentication with secure token storage
- Store discovery with MapKit
- Menu browsing and customization
- Shopping cart management
- Order history and tracking
- Rewards and loyalty points
- Profile management
- Gift card support
- Stripe payment integration ready

## 📊 Project Status

| Module | Status | Endpoints | Notes |
|--------|--------|-----------|-------|
| Authentication | ✅ Complete | 3 | JWT with RS256 |
| Users | ✅ Complete | 6 | Profile, preferences, loyalty |
| Stores | ✅ Complete | 8 | Nearby search, details, hours |
| Menu | ✅ Complete | 10 | Items, categories, modifiers |
| Orders | ✅ Complete | 10 | Create, track, Toast POS integration |
| Rewards | ✅ Complete | 8 | Points, tiers, redemption |
| Gift Cards | ✅ Complete | 8 | Create, redeem, balance |
| Reviews | ✅ Complete | 10 | CRUD, moderation, stats |
| iOS App | ✅ Complete | 28 files | Full SwiftUI implementation |

**Total**: 53 API endpoints, 100% backend complete

## 🎯 Next Steps

1. **Test the Full Flow**
   - Start backend: `./start-backend.sh`
   - Open iOS app: `./start-ios.sh`
   - Sign up → Find stores → Browse menu → Place order

2. **Add Test Data**
   - Create stores via API or database
   - Add menu items and categories
   - Create test users

3. **Complete Integrations**
   - Add Stripe publishable key
   - Configure Toast POS credentials
   - Test payment flow

4. **Production Preparation**
   - Update API endpoint in iOS app
   - Configure production database
   - Deploy backend services
   - Submit iOS app to App Store

## Need Help?

- **API Docs**: http://localhost:3000/api/docs
- **Project Status**: See `PROJECT_STATUS.md`
- **Technical Spec**: See `target_tech_spec.txt`
- **Backend README**: See `backend/README.md`

---

**Happy Coding! ☕️**
