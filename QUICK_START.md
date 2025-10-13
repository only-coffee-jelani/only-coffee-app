# Only Coffee - Quick Start Guide

Get the Only Coffee backend up and running in 5 minutes!

## Prerequisites

Ensure you have the following installed:
- **Node.js 20 LTS** - [Download](https://nodejs.org/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)

## Step 1: Clone and Setup

```bash
# Navigate to the project
cd only-coffee-app-repo

# Install all dependencies (this may take a few minutes)
cd backend
npm install
```

## Step 2: Start Database Services

```bash
# Start PostgreSQL 16.4 and Redis 8.2 with Docker
docker-compose up -d postgres redis

# Verify services are running
docker ps
```

You should see:
- `only-coffee-postgres` on port 5432
- `only-coffee-redis` on port 6379

## Step 3: Run Database Migrations

```bash
# Run migrations to create all tables
npm run migration:run
```

This creates:
- 9 core tables (users, stores, orders, etc.)
- Proper indexes and foreign keys
- Monthly partitions for orders and rewards
- All database constraints

## Step 4: Start the Gateway API

```bash
# Navigate to the Gateway service
cd services/gateway

# Start in development mode with hot reload
npm run start:dev
```

The API will start on **http://localhost:3000**

## Step 5: Test the API

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

## Available API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/register` | Register new user | No |
| POST | `/api/v1/auth/login` | Login user | No |
| POST | `/api/v1/auth/refresh` | Refresh token | No |
| GET | `/api/v1/users/me` | Get profile | Yes |
| PUT | `/api/v1/users/me` | Update profile | Yes |
| GET | `/api/v1/users/me/loyalty` | Get loyalty info | Yes |
| GET | `/api/v1/stores/nearby` | Find nearby stores | No |
| GET | `/api/v1/stores/:id` | Get store details | No |
| GET | `/api/v1/health` | Health check | No |

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

## Next Steps

1. **Explore the API** - Try all endpoints in Swagger UI
2. **Add Test Data** - Create stores, menu items, orders
3. **Implement Features** - Build remaining modules (Menu, Orders, Rewards)
4. **Mobile Apps** - Start iOS/Android development
5. **Integrations** - Connect Toast POS, Stripe, delivery partners

## Need Help?

- **API Docs**: http://localhost:3000/api/docs
- **Project Status**: See `PROJECT_STATUS.md`
- **Technical Spec**: See `target_tech_spec.txt`
- **Backend README**: See `backend/README.md`

---

**Happy Coding! ☕️**
