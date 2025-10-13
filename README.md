# Only Coffee

A comprehensive mobile-first coffee ordering platform with native iOS and Android applications backed by a microservices architecture.

## Project Structure

```
.
├── backend/              # NestJS microservices backend
│   ├── gateway/         # API Gateway service
│   ├── orchestration/   # Order orchestration service
│   ├── rewards/         # Loyalty and rewards service
│   ├── delivery/        # Delivery integration service
│   ├── gifting/         # Social gifting service
│   ├── social/          # Social sharing and reviews
│   ├── catering/        # Catering order management
│   └── shared/          # Shared libraries and utilities
├── mobile/
│   ├── ios/             # Swift/SwiftUI iOS application
│   └── android/         # Kotlin/Jetpack Compose Android application
├── infrastructure/      # Terraform IaC and deployment configs
└── docs/               # API documentation and guides

```

## Technology Stack

### Backend
- **Framework**: NestJS 11.1.6 with TypeScript 5.x
- **Database**: PostgreSQL 16.4 with partitioning
- **Cache**: Redis 8.2 cluster mode
- **Message Queue**: AWS SNS/SQS
- **Container**: Docker with ECS Fargate

### Mobile
- **iOS**: Swift 5.10, SwiftUI, iOS 16+
- **Android**: Kotlin, Jetpack Compose, API 28+
- **Design System**: Style Dictionary for cross-platform tokens

### External Integrations
- Toast POS API (menu sync, order processing)
- Stripe Payments (Apple Pay, Google Pay)
- DoorDash Drive, Uber Direct, Grubhub
- Auth0/AWS Cognito (authentication)
- Segment → Amplitude (analytics)

## Key Features

- **Store Discovery**: Geolocation-based store, truck, and kiosk finder
- **Mobile Ordering**: Custom drink builder with dynamic pricing
- **Pickup Slots**: 5-minute interval scheduling with capacity management
- **Loyalty Program**: 10 points per $1, 500 points = free coffee ($6 value)
- **Social Gifting**: iMessage extension for sending coffee gifts
- **Multi-Platform Delivery**: Unified DoorDash, Uber, Grubhub integration
- **Catering**: Large order management (10-500 items)
- **Reviews & Sharing**: Social integration and review system

## Performance Targets

- Store discovery: < 500ms
- Menu load: < 200ms
- Slot availability: < 250ms
- Checkout: < 400ms p95
- Payment processing: < 3s
- 10,000+ concurrent users
- 99.9% uptime

## Getting Started

### Prerequisites

- Node.js 20 LTS
- Docker Desktop
- PostgreSQL 16.4
- Redis 8.2
- AWS CLI configured
- Xcode 15+ (for iOS development)
- Android Studio (for Android development)

### Backend Setup

```bash
cd backend
npm install
npm run start:dev
```

### Mobile Setup

See `mobile/ios/README.md` and `mobile/android/README.md` for platform-specific setup instructions.

## Development

### Running Locally

```bash
# Start backend services
docker-compose up -d postgres redis
cd backend && npm run start:dev

# Run iOS app
cd mobile/ios && open OnlyCoffee.xcodeproj

# Run Android app
cd mobile/android && ./gradlew assembleDebug
```

### Testing

```bash
# Backend tests
cd backend && npm run test

# iOS tests
cd mobile/ios && xcodebuild test

# Android tests
cd mobile/android && ./gradlew test
```

## Deployment

Infrastructure is managed with Terraform. See `infrastructure/README.md` for deployment instructions.

## Documentation

- [API Documentation](docs/api.md)
- [Database Schema](docs/database-schema.md)
- [Architecture Overview](docs/architecture.md)
- [Integration Guides](docs/integrations.md)

## License

Proprietary - All rights reserved
