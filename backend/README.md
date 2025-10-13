# Only Coffee Backend

Microservices backend for the Only Coffee platform built with NestJS and TypeScript.

## Architecture

The backend follows a microservices architecture with the following services:

- **Gateway API** - Entry point for all client requests, handles routing, authentication, and rate limiting
- **Orchestration Service** - Coordinates order workflows and business logic
- **Rewards Service** - Manages loyalty points and reward redemption
- **Delivery Service** - Integrates with DoorDash, Uber, and Grubhub APIs
- **Gifting Service** - Handles gift card and social gifting features
- **Social Service** - Manages reviews and social sharing
- **Catering Service** - Handles large order management

## Technology Stack

- **Framework**: NestJS 11.1.6
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 16.4 with partitioning
- **Cache**: Redis 8.2
- **Message Queue**: AWS SNS/SQS
- **ORM**: TypeORM 0.3.20

## Database Schema

### Core Tables

- `users` - User accounts and profiles
- `stores` - Coffee shop locations (stores, trucks, kiosks)
- `orders` - Order records (partitioned by month)
- `order_items` - Line items for orders
- `menu_items` - Menu catalog synced from Toast POS
- `rewards_ledger` - Loyalty points transactions (partitioned by month)
- `gift_cards` - Gift cards and vouchers
- `delivery_orders` - Delivery tracking and status
- `reviews` - User reviews and ratings

## Getting Started

### Prerequisites

- Node.js 20 LTS
- PostgreSQL 16.4
- Redis 8.2
- Docker (optional, for local development)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis

# Run database migrations
npm run migration:run

# Start development server
npm run start:dev
```

### Environment Variables

See `.env.example` for all required environment variables. Key variables:

- `DB_*` - PostgreSQL connection settings
- `REDIS_*` - Redis connection settings
- `JWT_SECRET` - Secret for JWT token signing
- `TOAST_*` - Toast POS API credentials
- `STRIPE_*` - Stripe payment credentials
- `AWS_*` - AWS services credentials

## Development

### Running Services

```bash
# Start all services in development mode
npm run start:dev

# Start specific service
npm run start:dev --workspace=services/gateway

# Build all services
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:cov
```

### Database Migrations

```bash
# Generate a new migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure

```
backend/
├── services/
│   ├── gateway/          # API Gateway service
│   ├── orchestration/    # Order orchestration
│   ├── rewards/          # Loyalty and rewards
│   ├── delivery/         # Delivery integration
│   ├── gifting/          # Gift cards
│   ├── social/           # Reviews and sharing
│   └── catering/         # Catering orders
├── shared/
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── database/
│   │   │   └── entities/ # TypeORM entities
│   │   ├── dto/          # Data transfer objects
│   │   ├── guards/       # Auth guards
│   │   ├── interceptors/ # Request/response interceptors
│   │   ├── interfaces/   # TypeScript interfaces
│   │   ├── pipes/        # Validation pipes
│   │   └── utils/        # Utility functions
│   └── package.json
├── database/
│   └── migrations/       # Database migrations
├── package.json
├── tsconfig.json
└── .env.example
```

## API Documentation

Once the Gateway service is running, API documentation is available at:

- **Swagger UI**: http://localhost:3000/api/docs
- **OpenAPI JSON**: http://localhost:3000/api/docs-json

## Performance Targets

- Store discovery: < 500ms
- Menu load: < 200ms
- Slot availability: < 250ms
- Checkout: < 400ms p95
- Payment processing: < 3s

## External Integrations

### Toast POS

- Menu synchronization (30s updates)
- Order creation and status updates
- Payment reconciliation

### Stripe Payments

- Card payments
- Apple Pay and Google Pay
- Webhook processing for payment events

### Delivery Partners

- **DoorDash Drive**: White-label delivery
- **Uber Direct**: On-demand delivery
- **Grubhub**: Restaurant delivery

### Analytics

- **Segment**: Event collection
- **Amplitude**: User behavior analysis

## Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Deployment

See `../infrastructure/README.md` for deployment instructions using Terraform and AWS ECS Fargate.

## Monitoring

- **Application Monitoring**: Sentry
- **Infrastructure Monitoring**: AWS CloudWatch
- **Log Aggregation**: CloudWatch Logs

## License

Proprietary - All rights reserved
