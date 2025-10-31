# AI Personalization System - Phase 1 Setup Guide

## 🎯 Current Status
✅ **COMPLETED**: Database migration created
✅ **COMPLETED**: TypeORM entities created
✅ **COMPLETED**: Event tracking backend service implemented
✅ **COMPLETED**: iOS Event Tracking SDK implemented
✅ **COMPLETED**: Weather API integration
✅ **COMPLETED**: Feature Store (Redis + PostgreSQL)
✅ **COMPLETED**: Kinesis streaming infrastructure code (AWS setup required)
⏳ **READY FOR DEPLOYMENT**: Phase 1 code complete, AWS infrastructure setup needed

---

## 📋 Phase 1 Checklist

### 1. Database Migration (✅ DONE)
The migration `1729285000000-AddAIPersonalizationSystem.ts` has been created.

**To apply the migration:**
```bash
cd backend
npm run typeorm migration:run
```

**Tables created:**
- `user_events` - Behavioral event tracking
- `user_profiles` - ML features and user metrics
- `ai_promotions` - AI-generated promotions for admin review
- `promotion_executions` - Delivery tracking and outcomes
- `user_segments` - Segment assignments
- `model_logs` - ML decision audit trail
- `notification_preferences` - User notification controls

### 2. TypeORM Entities (✅ DONE)
The following entity files have been created in `backend/shared/src/database/entities/`:

**Created files:**
- `user-event.entity.ts` - Event tracking entity
- `user-profile.entity.ts` - ML features and user metrics
- `ai-promotion.entity.ts` - AI-generated promotions
- `promotion-execution.entity.ts` - Delivery tracking
- `user-segment.entity.ts` - Segment assignment history
- `model-log.entity.ts` - ML decision audit trail
- `notification-preference.entity.ts` - User notification controls

All entities are exported from `backend/shared/src/database/entities/index.ts`.

### 3. Event Tracking Service (✅ DONE)
The event tracking service has been implemented in `backend/services/gateway/src/modules/events/`.

**Created files:**
- `events.service.ts` - Core service for tracking and querying events
- `events.controller.ts` - REST API endpoints
- `events.module.ts` - NestJS module definition
- `dto/track-event.dto.ts` - Request validation DTO

**API Endpoints:**
- `POST /api/v1/events/track` - Track single event
- `POST /api/v1/events/track/batch` - Track multiple events
- `GET /api/v1/events/history` - Get user event history
- `GET /api/v1/events/count/:eventType` - Get event count by type
- `GET /api/v1/events/session/:sessionId` - Get session activity
- `GET /api/v1/events/stats` - Get event statistics (admin)

The EventsModule is registered in `app.module.ts`.

### 4. iOS Event Tracking SDK (✅ DONE)
The iOS Event Tracking SDK has been implemented in `mobile/ios/OnlyCoffee/`.

**Created files:**
- `Models/UserEvent.swift` - Event types, request/response models, AnyCodable helper
- `Services/EventTrackerService.swift` - API service for tracking events
- `Managers/EventTrackerManager.swift` - Automatic session and lifecycle tracking

**Features:**
- 19 event types matching backend enum
- Automatic app lifecycle tracking (app_opened, app_closed)
- Session management with unique session IDs
- Event batching (10 events or 30 seconds)
- Privacy controls (enable/disable tracking)
- Location support for geofence events
- Convenience methods for common events

**Integration:**
See `mobile/ios/EVENT_TRACKER_INTEGRATION_GUIDE.md` for complete integration examples.

**Quick usage:**
```swift
// Automatic lifecycle events (no code needed)
// - app_opened tracked on launch
// - app_closed tracked on background

// Manual event tracking
Task {
    // Track menu viewed
    await EventTrackerService.shared.trackMenuViewed()

    // Track item viewed
    await EventTrackerService.shared.trackItemViewed(
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        price: item.price
    )

    // Track purchase
    await EventTrackerService.shared.trackPurchaseCompleted(
        orderId: order.id,
        totalAmount: order.total,
        items: orderItems
    )
}
```

### 5. Weather API Integration (✅ DONE)
The Weather API service has been implemented in `backend/services/gateway/src/modules/weather/`.

**Created files:**
- `weather.service.ts` - OpenWeatherMap integration with caching
- `weather.controller.ts` - REST API endpoints
- `weather.module.ts` - NestJS module definition

**Features:**
- OpenWeatherMap API integration
- 10-minute caching with LRU eviction (stays within 1000 calls/day free tier)
- Weather-based promotion triggers
- Weather-based product recommendations
- Automatic event enrichment with weather context

**API Endpoints:**
- `GET /api/v1/weather/current?lat=X&lon=Y` - Get current weather by coordinates
- `GET /api/v1/weather/city?name=CityName` - Get weather by city name
- `GET /api/v1/weather/recommendations?lat=X&lon=Y` - Get weather-based product recommendations
- `GET /api/v1/weather/promotion-trigger?lat=X&lon=Y` - Check if weather should trigger promotion
- `GET /api/v1/weather/cache-stats` - Get cache statistics (debugging)

**Weather-Based Triggers:**
- Extreme heat (>30°C/86°F) → Promote iced drinks
- Cold weather (<5°C/41°F) → Promote hot drinks
- Rainy weather → Promote warm beverages
- Sunny weather → Promote iced drinks

**Setup:**
1. Get free API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Add to `.env`:
   ```env
   WEATHER_API_KEY=your-api-key-here
   WEATHER_API_URL=https://api.openweathermap.org/data/2.5/weather
   ```

### 6. Feature Store (✅ DONE)
The Feature Store has been implemented with Redis for online features and PostgreSQL for offline features.

**Created files:**
- `interfaces/user-features.interface.ts` - TypeScript interfaces for all feature types
- `feature-store.service.ts` - Core service for computing and caching features
- `feature-store.controller.ts` - REST API endpoints
- `feature-store.module.ts` - NestJS module definition

**Feature Groups:**
1. **RFM Features** (Recency, Frequency, Monetary)
   - Days since last purchase/app open
   - Purchase counts (7d, 30d, 90d)
   - Spending metrics and averages
   - RFM scores (1-5 scale)

2. **Engagement Features**
   - Current/longest streaks
   - Session metrics (duration, time between visits)
   - Menu and item view counts
   - Favorite categories and items
   - Time patterns (preferred time of day, day of week)
   - Loyalty status and points

3. **Behavioral Features**
   - Cart abandonment rate
   - Average cart size and items per order
   - Discount sensitivity score
   - Location patterns (favorite store, unique stores visited)
   - Device and platform preferences
   - Notification preferences

4. **Contextual Features** (real-time)
   - Current weather conditions
   - Location context (distance to nearest store)
   - Temporal context (time of day, day of week, weekend/holiday)
   - Session context (session ID, events in session)

5. **Churn Prediction Features**
   - Days since last activity
   - Activity trend (increasing/stable/decreasing)
   - Engagement decline rate
   - Churn risk segment (low/medium/high/critical)
   - Promotion history and response rate

**API Endpoints:**
- `GET /api/v1/features/user` - Get all user features (with caching)
- `GET /api/v1/features/user/:featureGroup` - Get specific feature group
- `GET /api/v1/features/rfm-scores` - Get RFM scores (lightweight)
- `GET /api/v1/features/contextual?lat=X&lon=Y&sessionId=Z` - Get real-time contextual features
- `GET /api/v1/features/churn-risk` - Get churn risk assessment
- `GET /api/v1/features/quality` - Get feature quality metrics
- `POST /api/v1/features/invalidate-cache` - Clear user feature cache
- `POST /api/v1/features/batch-compute` - Batch compute features (admin)

**Caching Strategy:**
- **Online Store (Redis)**: 5-minute TTL for fast feature serving
- **Offline Store (PostgreSQL)**: Stored in `user_profiles.featureVector`
- Features are computed on-demand and cached
- Cache can be force-refreshed with `?forceRefresh=true`

**Setup:**
1. Install Redis (if not already installed):
   ```bash
   # macOS
   brew install redis
   brew services start redis

   # Ubuntu
   sudo apt-get install redis-server
   sudo systemctl start redis
   ```

2. Add to `.env`:
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_DB=0
   ```

3. ioredis is already installed in dependencies (line 32 of package.json)

**Usage Example:**
```typescript
// Get all user features
const response = await fetch('/api/v1/features/user', {
  headers: { Authorization: `Bearer ${token}` }
});

// Get contextual features with location
const contextual = await fetch(
  '/api/v1/features/contextual?latitude=37.7749&longitude=-122.4194&sessionId=abc123',
  { headers: { Authorization: `Bearer ${token}` }}
);

// Get RFM scores for personalization
const rfm = await fetch('/api/v1/features/rfm-scores', {
  headers: { Authorization: `Bearer ${token}` }
});
```

**Data Quality Metrics:**
Each feature vector includes quality metrics:
- `completeness`: 0-1 score based on data availability
- `freshness`: 0-1 score based on data recency
- `confidence`: 0-1 score based on data volume

---

## 7. Event Streaming Infrastructure (✅ DONE - Code Complete)
The Kinesis streaming infrastructure has been implemented with NestJS integration and Lambda processing.

**Created files:**
- `backend/services/gateway/src/modules/streaming/kinesis.service.ts` - Kinesis client with batch support
- `backend/services/gateway/src/modules/streaming/streaming.module.ts` - NestJS module
- `backend/lambda/kinesis-event-processor/index.js` - Lambda function for processing events
- `backend/lambda/kinesis-event-processor/package.json` - Lambda dependencies
- `backend/lambda/kinesis-event-processor/deploy.sh` - Deployment script
- `backend/lambda/kinesis-event-processor/README.md` - Full documentation

**Backend Integration:**
- EventsService now automatically pushes events to Kinesis (when enabled)
- Non-blocking async push (failures don't affect API response)
- Batch support for efficient streaming (up to 500 records per request)
- Partitioned by userId for ordered processing

**Lambda Function Capabilities:**
1. **Updates User Profiles** - Real-time metrics in PostgreSQL
   - Last activity timestamps
   - Purchase counts and lifetime value
   - App open counts, cart abandonment
   - Streak milestones

2. **Streams to BigQuery** - Long-term analytics storage
   - All events stored for ML training
   - 10GB/day free tier

3. **Triggers AI Promotions** - Detects high-value events
   - Purchase completed, cart abandoned
   - Streak milestones (7, 14, 30 days)
   - Geofence entered, weather triggers
   - Frequency capping (max 2/week per user)

**Architecture:**
```
Mobile App → API Gateway → EventsService
                            ├─► PostgreSQL (immediate storage)
                            └─► Kinesis Stream → Lambda
                                                  ├─► Update user_profiles
                                                  ├─► Insert to BigQuery
                                                  └─► Queue AI promotions
```

**To Enable Kinesis Streaming:**

Add to `backend/.env`:
```env
ENABLE_KINESIS=true
AWS_REGION=us-east-1
AWS_KINESIS_STREAM_NAME=only-coffee-user-events
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

**AWS Setup Required** (follow Section 8 below):
1. Create Kinesis Data Stream
2. Deploy Lambda function with `deploy.sh`
3. Set up event source mapping
4. Configure BigQuery dataset

**Complete documentation**: See `backend/lambda/kinesis-event-processor/README.md`

---

## 8. AWS Free Tier Setup

### AWS Account Prerequisites
1. Create AWS account (if not exists)
2. Configure AWS CLI:
   ```bash
   aws configure
   # Enter your AWS Access Key ID
   # Enter your AWS Secret Access Key
   # Default region: us-east-1
   # Default output format: json
   ```

### A. AWS Kinesis Data Streams (FREE TIER)
**Free tier**: 1 million PUT records/month

```bash
# Create Kinesis stream for user events
aws kinesis create-stream \
  --stream-name only-coffee-user-events \
  --shard-count 1 \
  --region us-east-1

# Verify stream creation
aws kinesis describe-stream \
  --stream-name only-coffee-user-events \
  --region us-east-1
```

### B. AWS Lambda Functions (FREE TIER)
**Free tier**: 1M requests/month, 400K GB-seconds compute

**Create Lambda execution role:**
```bash
# Create trust policy file
cat > lambda-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Service": "lambda.amazonaws.com"
    },
    "Action": "sts:AssumeRole"
  }]
}
EOF

# Create role
aws iam create-role \
  --role-name OnlyCoffeeLambdaRole \
  --assume-role-policy-document file://lambda-trust-policy.json

# Attach policies
aws iam attach-role-policy \
  --role-name OnlyCoffeeLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam attach-role-policy \
  --role-name OnlyCoffeeLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonKinesisReadOnlyAccess
```

### C. Google BigQuery Setup (FREE TIER)
**Free tier**: 1TB queries/month, 10GB storage

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "only-coffee-analytics"
3. Enable BigQuery API
4. Create dataset:
   ```sql
   CREATE SCHEMA `only-coffee-analytics.user_events`
   OPTIONS(
     location="US",
     description="User behavioral events"
   );
   ```

5. Download service account key:
   - IAM & Admin → Service Accounts → Create Service Account
   - Grant "BigQuery Data Editor" role
   - Create JSON key → Save as `bigquery-key.json`

### D. OneSignal Setup (FREE)
**Free tier**: Unlimited devices, basic features

1. Go to [OneSignal](https://onesignal.com/)
2. Create account → New App
3. Select "Apple iOS" platform
4. Follow setup wizard:
   - Upload iOS push certificate (.p12 file)
   - Save App ID

**Environment variables to add:**
```env
ONESIGNAL_APP_ID=your-app-id-here
ONESIGNAL_API_KEY=your-api-key-here
```

---

## 3. Backend Configuration

### Environment Variables
Add to `backend/.env`:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_KINESIS_STREAM_NAME=only-coffee-user-events
AWS_LAMBDA_ROLE_ARN=arn:aws:iam::YOUR-ACCOUNT-ID:role/OnlyCoffeeLambdaRole

# BigQuery Configuration
BIGQUERY_PROJECT_ID=only-coffee-analytics
BIGQUERY_DATASET=user_events
BIGQUERY_KEY_FILE=./config/bigquery-key.json

# OneSignal Configuration
ONESIGNAL_APP_ID=your-onesignal-app-id
ONESIGNAL_API_KEY=your-onesignal-api-key

# ML Feature Store (using PostgreSQL for now, Redis later)
FEATURE_STORE_TYPE=postgresql
FEATURE_STORE_TTL=3600

# OpenWeatherMap API (FREE tier: 1000 calls/day)
WEATHER_API_KEY=your-openweather-api-key
WEATHER_API_URL=https://api.openweathermap.org/data/2.5/weather

# AI Configuration
ML_MODEL_VERSION=v1.0.0
ML_CONFIDENCE_THRESHOLD=0.7
ENABLE_AI_PROMOTIONS=false  # Keep false until models are trained

# Notification Limits (prevent abuse)
MAX_NOTIFICATIONS_PER_USER_DAY=3
MAX_NOTIFICATIONS_PER_USER_WEEK=10
NOTIFICATION_QUIET_HOURS_START=22
NOTIFICATION_QUIET_HOURS_END=8
```

### Install Dependencies
```bash
cd backend
npm install --save \
  @aws-sdk/client-kinesis \
  @aws-sdk/client-lambda \
  @google-cloud/bigquery \
  onesignal-node \
  axios
```

---

## 4. Next Steps

### A. Create Event Tracking Service
File: `backend/services/events/event-tracker.service.ts`

This will:
- Accept events from mobile app
- Validate and enrich event data
- Send to Kinesis stream
- Store in PostgreSQL (immediate)
- Async push to BigQuery (batch)

### B. Create Lambda Consumer
Function to process Kinesis events and update user profiles in real-time.

### C. iOS Event Tracking SDK
File: `mobile/ios/OnlyCoffee/Services/EventTracker.swift`

Track events like:
- App opened/closed
- Purchase completed
- Location updates
- Notification interactions

### D. Initial Data Population
Create script to populate `user_profiles` from existing purchase data:
```sql
INSERT INTO user_profiles (
  "userId",
  "totalPurchases",
  "avgOrderValue",
  "lastPurchaseDate",
  "firstPurchaseDate"
)
SELECT
  u.id,
  COUNT(o.id),
  AVG(o."totalAmount"),
  MAX(o."createdAt"),
  MIN(o."createdAt")
FROM users u
LEFT JOIN orders o ON u.id = o."userId"
GROUP BY u.id;
```

---

## 5. Free Tier Cost Monitoring

### AWS Free Tier Limits
✅ **Kinesis**: 1M PUT records/month → ~33K events/day
✅ **Lambda**: 1M requests/month → ~33K invocations/day
✅ **RDS PostgreSQL**: Already running (existing)

### BigQuery Free Tier
✅ **Storage**: 10GB/month
✅ **Queries**: 1TB/month
✅ **Streaming inserts**: 10GB/day

### OneSignal Free Tier
✅ **Unlimited devices**
✅ **Unlimited notifications**
✅ **Basic segmentation**

### Weather API Free Tier
✅ **1000 calls/day** (enough for cache-based lookups)

**Expected usage at 1000 users:**
- Events: ~5K/day (well within limits)
- Lambda: ~5K/day (within limits)
- BigQuery: ~100MB/day storage (within limits)
- Notifications: ~500/day (within limits)

---

## 6. Development Workflow

### Phase 1 Timeline (Weeks 1-4)
- **Week 1**: Database migration ✅, Event tracking service
- **Week 2**: Kinesis/Lambda setup, BigQuery integration
- **Week 3**: iOS SDK, OneSignal integration
- **Week 4**: Feature computation pipelines, Testing

### Testing the System
1. Run migration: `npm run typeorm migration:run`
2. Start backend: `npm run dev`
3. Send test event via API
4. Verify event in PostgreSQL: `SELECT * FROM user_events LIMIT 10;`
5. Check Kinesis stream: `aws kinesis get-records --shard-iterator ...`

---

## 7. Rollback Plan

If you need to rollback the migration:
```bash
cd backend
npm run typeorm migration:revert
```

This will drop all AI personalization tables.

---

## 📞 Support & Resources

### Documentation Links
- [AWS Kinesis](https://docs.aws.amazon.com/kinesis/)
- [AWS Lambda](https://docs.aws.amazon.com/lambda/)
- [Google BigQuery](https://cloud.google.com/bigquery/docs)
- [OneSignal](https://documentation.onesignal.com/)
- [OpenWeatherMap API](https://openweathermap.org/api)

### Cost Alerts
Set up AWS billing alerts:
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name only-coffee-cost-alert \
  --alarm-description "Alert if AWS costs exceed $5" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --evaluation-periods 1 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold
```

---

## ✅ Phase 1 Completion Criteria

- [ ] Database migration applied successfully
- [ ] AWS Kinesis stream created and tested
- [ ] Lambda function deployed and processing events
- [ ] BigQuery dataset created and receiving data
- [ ] OneSignal integrated and test notification sent
- [ ] Event tracking service accepts and stores events
- [ ] iOS SDK tracks basic events (app open, purchase)
- [ ] User profiles populated from historical data
- [ ] Weather API integration working

**Ready for Phase 2 when all criteria are met!**
