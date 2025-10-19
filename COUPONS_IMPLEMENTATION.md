# Only Coffee Coupons & Promo Codes System

## Implementation Summary

This document describes the complete implementation of the coupons and promo codes system for Only Coffee, including backend API, database schema, iOS mobile UI, and Android mobile UI.

---

## 📋 Table of Contents

1. [Features](#features)
2. [Architecture Overview](#architecture-overview)
3. [Backend Implementation](#backend-implementation)
4. [iOS Implementation](#ios-implementation)
5. [Android Implementation](#android-implementation)
6. [API Endpoints](#api-endpoints)
7. [Database Schema](#database-schema)
8. [Usage Guide](#usage-guide)
9. [Testing](#testing)

---

## ✨ Features

### Core Functionality
- ✅ **Promo Code System**: Create, validate, and track usage of promotional codes
- ✅ **Coupon Types**: Support for 4 types (percent off, fixed price, fixed amount, free item)
- ✅ **Auto-Grant**: 4 starter coupons automatically granted to new users
- ✅ **Expiration Management**: Automated nightly cleanup with timezone support (America/Chicago)
- ✅ **Multi-Channel**: Coupons work in-app and/or in-store
- ✅ **Item Restrictions**: Configurable include/exclude lists for eligible items
- ✅ **Idempotency**: Prevents duplicate promo code redemptions
- ✅ **Admin Controls**: Full CRUD operations and analytics for administrators

### User Experience
- ✅ **My Coupons**: View active, expired, and redeemed coupons
- ✅ **Promo Code Entry**: Easy input field with validation and feedback
- ✅ **Visual States**: Color-coded cards for active, expiring soon, and expired coupons
- ✅ **Expiry Notifications**: Hooks ready for 48h and same-day reminders
- ✅ **Sorting**: Soon-to-expire coupons surface first

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       Mobile Apps (iOS & Android)                         │
│  ┌────────────────────────────────┬────────────────────────────────────┐ │
│  │            iOS (Swift)         │         Android (Kotlin)           │ │
│  │  ┌──────────────────────────┐  │  ┌──────────────────────────────┐ │ │
│  │  │    MyCouponsView         │  │  │    MyCouponsScreen           │ │ │
│  │  │    CouponCard            │  │  │    CouponCard                │ │ │
│  │  │    PromoCodeEntryView    │  │  │    PromoCodeEntryDialog      │ │ │
│  │  └──────────┬───────────────┘  │  └──────────┬───────────────────┘ │ │
│  │             │                   │             │                      │ │
│  │  ┌──────────▼───────────────┐  │  ┌──────────▼───────────────────┐ │ │
│  │  │  CouponsAPIService       │  │  │  CouponsRepository +         │ │ │
│  │  │  (URLSession)            │  │  │  CouponsApiService           │ │ │
│  │  └──────────┬───────────────┘  │  │  (Retrofit + Hilt)           │ │ │
│  │             │                   │  └──────────┬───────────────────┘ │ │
│  └─────────────┼───────────────────┴─────────────┼─────────────────────┘ │
│                └───────────────────┬──────────────┘                       │
└────────────────────────────────────┼──────────────────────────────────────┘
                                     │ HTTPS/REST
┌────────────────────────────────────▼──────────────────────────────────────┐
│                       NestJS Backend (Gateway)                             │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐               │
│  │PromoCodesModule │  │CouponsModule │  │  TasksModule   │               │
│  └────────┬────────┘  └──────┬───────┘  └────────┬───────┘               │
│           │                  │                     │                       │
│  ┌────────▼──────────────────▼─────────────────────▼─────────────────┐   │
│  │                TypeORM + PostgreSQL Database                        │   │
│  │  ┌──────────────┐          ┌───────────────────┐                   │   │
│  │  │ promo_codes  │─────────▶│  coupon_grants    │                   │   │
│  │  └──────────────┘          └───────────────────┘                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Backend Implementation

### Technology Stack
- **Runtime**: Node.js 20
- **Framework**: NestJS 11
- **ORM**: TypeORM
- **Database**: PostgreSQL
- **Date/Time**: Luxon (America/Chicago timezone)
- **Scheduling**: @nestjs/schedule

### Files Created

#### Database Layer
```
backend/shared/src/database/entities/
├── promo-code.entity.ts       # PromoCode entity with enums
├── coupon-grant.entity.ts     # CouponGrant entity with enums
└── index.ts                   # Updated exports

backend/database/migrations/
└── 1729253400000-AddCouponSystem.ts  # Migration for tables and indexes
```

#### Services
```
backend/services/gateway/src/modules/
├── promo-codes/
│   ├── promo-codes.service.ts        # Business logic for promo codes
│   ├── promo-codes.controller.ts     # Admin endpoints
│   ├── promo-codes.module.ts         # NestJS module
│   └── dto/create-promo-code.dto.ts  # Input validation
├── coupons/
│   ├── coupons.service.ts            # Business logic for coupons
│   ├── coupons.controller.ts         # User + admin endpoints
│   ├── coupons.module.ts             # NestJS module
│   └── dto/
│       ├── redeem-promo-code.dto.ts
│       ├── redeem-coupon.dto.ts
│       └── grant-coupon.dto.ts
└── tasks/
    ├── tasks.service.ts              # Cron jobs
    └── tasks.module.ts               # NestJS module
```

### Key Features

#### 1. Starter Coupons (Auto-Grant)
When a new user registers, they automatically receive:
- 2x **50% Off Drink** (7 days, excludes Waffolino)
- 2x **First Sip** - $1.99 drink (7 days, excludes Waffolino & Pistacchio)

**Implementation**: Integrated into `AuthService.register()` method.

#### 2. Promo Code Creation (Admin)
```typescript
POST /api/v1/v1/admin/promo-codes
{
  "code": "WELCOME2025",
  "type": "MULTI_USE",
  "maxUses": 500,
  "expiresAt": "2025-12-31T23:59:59Z",
  "couponConfig": [
    {
      "type": "percent_off",
      "percentOff": 50,
      "label": "50% Off Drink",
      "expiresInDays": 7
    }
  ]
}
```

#### 3. Promo Code Redemption (User)
```typescript
POST /api/v1/v1/coupons/redeem-code
Headers: { "idempotency-key": "<uuid>" }
{
  "code": "WELCOME2025"
}

Response:
{
  "success": true,
  "message": "✅ 1 new coupon added! Expires in 7 days.",
  "data": [{ ...coupon }]
}
```

#### 4. Automated Tasks
- **Midnight CST**: Mark expired coupons (`tasks.service.ts`)
- **Every hour**: Check coupons expiring in 48 hours (notification hooks ready)
- **Every hour**: Check coupons expiring today (final reminder hooks ready)

---

## 📱 iOS Implementation

### Technology Stack
- **Language**: Swift 5
- **UI Framework**: SwiftUI
- **Networking**: URLSession (async/await)
- **Architecture**: MVVM pattern

### Files Created

```
mobile/ios/OnlyCoffee/
├── Models/
│   └── Coupon.swift                    # Data models and response types
├── Services/
│   └── CouponsAPIService.swift         # API client
└── Views/Coupons/
    ├── MyCouponsView.swift             # Main screen with tabs
    ├── CouponCard.swift                # Coupon card component + detail view
    └── PromoCodeEntryView.swift        # Promo code input modal
```

### UI Components

#### 1. MyCouponsView
- Tabbed interface (Active / Expired)
- Promo code entry button
- Empty states with helpful messaging
- Pull-to-refresh functionality
- Loading and error states

#### 2. CouponCard
- Visual states: active (pink), expiring soon (orange), expired (gray)
- Displays: value, label, description, expiry, channel
- "Use Now" button for active coupons
- Tap to view details

#### 3. PromoCodeEntryView
- Text input with uppercase auto-capitalization
- Submit button with loading state
- Success/error messaging
- Preview of granted coupons
- Auto-dismiss on success

### Coupon Model Features
```swift
struct Coupon {
    // Computed properties
    var isActive: Bool           // Active and not expired
    var isExpired: Bool          // Past expiry date
    var isExpiringSoon: Bool     // < 24 hours remaining
    var displayValue: String     // "50% OFF", "$1.99", etc.
    var expiryText: String       // "Expires in 3 days"
    var channelText: String      // "App Only", "In-Store", etc.
}
```

---

## 🤖 Android Implementation

### Technology Stack
- **Language**: Kotlin
- **UI Framework**: Jetpack Compose
- **Networking**: Retrofit + OkHttp
- **DI**: Dagger Hilt
- **Architecture**: MVVM with StateFlow

### Files Created

```
android/app/src/main/java/com/onlycoffee/app/
├── data/
│   ├── model/
│   │   └── Coupon.kt                          # Data models and API responses
│   ├── api/
│   │   └── CouponsApiService.kt               # Retrofit API interface
│   └── repository/
│       └── CouponsRepository.kt               # Repository layer
├── di/
│   └── NetworkModule.kt                       # Hilt DI module for Retrofit
└── ui/screens/coupons/
    ├── CouponsViewModel.kt                     # ViewModel with StateFlow
    ├── MyCouponsScreen.kt                      # Main screen with tabs
    ├── CouponCard.kt                          # Coupon card + detail dialog
    └── PromoCodeEntryDialog.kt                # Promo code input dialog
```

### UI Components

#### 1. MyCouponsScreen
- Material 3 design with TabRow for Active/Expired tabs
- Promo code entry button in Surface card
- LazyColumn for coupon list with proper spacing
- Loading, error, and empty states
- Pull-to-refresh via ViewModel

#### 2. CouponCard
- Card with elevation and rounded corners
- Color-coded value badges: active (pink #E91E63), expiring (orange), expired (gray)
- Channel badges with icons (phone for app-only, bag for in-store)
- "Use Now" button for active coupons
- Click to show detail dialog

#### 3. PromoCodeEntryDialog
- Full-screen modal dialog
- TextField with auto-uppercase transformation
- Submit button with CircularProgressIndicator loading state
- Success/error messaging with appropriate colors
- Preview cards for granted coupons
- Keyboard actions for better UX

### Coupon Model Features
```kotlin
data class Coupon {
    // Computed properties
    val isExpired: Boolean        // Date().after(expiresAt)
    val isActive: Boolean         // Active status and not expired
    val isExpiringSoon: Boolean   // < 24 hours remaining
    val displayValue: String      // "50% OFF", "$1.99", etc.
    val expiryText: String        // "Expires in 3 days"
    val channelText: String       // "App Only", "In-Store", etc.
}
```

### Dependency Injection Setup

The NetworkModule provides:
- Gson with ISO8601 date parsing
- OkHttp with logging interceptor
- Retrofit instance with base URL from BuildConfig
- CouponsApiService singleton

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides
    @Singleton
    fun provideCouponsApiService(retrofit: Retrofit): CouponsApiService {
        return retrofit.create(CouponsApiService::class.java)
    }
}
```

### ViewModel Pattern

The CouponsViewModel manages state with StateFlow:
```kotlin
data class CouponsUiState(
    val isLoading: Boolean = false,
    val activeCoupons: List<Coupon> = emptyList(),
    val expiredCoupons: List<Coupon> = emptyList(),
    val selectedTab: Int = 0,
    val errorMessage: String? = null,
    val promoCodeResult: PromoCodeResult? = null
)
```

---

## 🌐 API Endpoints

### User Endpoints

#### Get My Coupons
```
GET /api/v1/v1/coupons/my-coupons
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "active": [...],
    "expired": [...],
    "redeemed": [...],
    "all": [...]
  }
}
```

#### Redeem Promo Code
```
POST /api/v1/v1/coupons/redeem-code
Authorization: Bearer <token>
Idempotency-Key: <uuid>

Body: { "code": "WELCOME2025" }
```

#### Get Coupon Details
```
GET /api/v1/v1/coupons/:id
Authorization: Bearer <token>
```

#### Redeem Coupon on Order
```
POST /api/v1/v1/coupons/redeem
Authorization: Bearer <token>

Body:
{
  "couponId": "...",
  "orderId": "..."
}
```

### Admin Endpoints

#### Create Promo Code
```
POST /api/v1/v1/admin/promo-codes
Authorization: Bearer <admin-token>
```

#### List All Promo Codes
```
GET /api/v1/v1/admin/promo-codes?page=1&limit=50&isActive=true
```

#### Get Promo Code Stats
```
GET /api/v1/v1/admin/promo-codes/:id/stats

Response:
{
  "totalUses": 150,
  "totalCouponsGranted": 150,
  "totalCouponsRedeemed": 87,
  "redemptionRate": 58.0
}
```

#### Manually Grant Coupon
```
POST /api/v1/v1/admin/coupons/grant

Body:
{
  "userId": "...",
  "type": "percent_off",
  "percentOff": 25,
  "label": "25% Off",
  "expiresInDays": 14
}
```

---

## 🗄️ Database Schema

### promo_codes Table
```sql
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  type promo_type_enum NOT NULL,     -- single_use, multi_use, unlimited
  created_by VARCHAR(255),
  max_uses INT,
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  coupon_config JSONB,                -- Array of coupon definitions
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_is_active ON promo_codes(is_active);
```

### coupon_grants Table
```sql
CREATE TABLE coupon_grants (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  promo_code_id UUID,
  type coupon_type_enum NOT NULL,     -- percent_off, fixed_price, fixed_amount, free_item
  label VARCHAR(255) NOT NULL,
  description TEXT,
  value_cents INT,                     -- For FIXED_AMOUNT
  percent_off INT,                     -- For PERCENT_OFF (0-100)
  price_override_cents INT,            -- For FIXED_PRICE
  eligible_items JSONB,                -- { exclude: [...], include: [...] }
  channels VARCHAR(50) DEFAULT 'both', -- app_only, in_store, both
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  redeemed_order_id UUID,
  status coupon_status_enum DEFAULT 'active',  -- active, redeemed, expired, cancelled
  source VARCHAR(100) NOT NULL,        -- promo_code, loyalty_reward, new_user, admin_grant
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE SET NULL
);

CREATE INDEX idx_coupon_grants_user_status ON coupon_grants(user_id, status);
CREATE INDEX idx_coupon_grants_status_expires ON coupon_grants(status, expires_at);
CREATE INDEX idx_coupon_grants_promo_code ON coupon_grants(promo_code_id);
```

---

## 📖 Usage Guide

### For Administrators

#### 1. Create a Promo Code Campaign
```bash
curl -X POST https://api.onlycoffee.com/api/v1/v1/admin/promo-codes \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SUMMER25",
    "type": "MULTI_USE",
    "maxUses": 1000,
    "expiresAt": "2025-08-31T23:59:59Z",
    "couponConfig": [
      {
        "type": "percent_off",
        "percentOff": 25,
        "label": "25% Off Summer Special",
        "description": "Get 25% off any drink this summer",
        "expiresInDays": 30,
        "eligibleItems": { "exclude": ["waffolino"] },
        "channels": "both"
      }
    ]
  }'
```

#### 2. Monitor Campaign Performance
```bash
curl https://api.onlycoffee.com/api/v1/v1/admin/promo-codes/<id>/stats \
  -H "Authorization: Bearer <admin-token>"
```

#### 3. Manually Grant Coupon to User
```bash
curl -X POST https://api.onlycoffee.com/api/v1/v1/admin/coupons/grant \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<user-id>",
    "type": "free_item",
    "label": "Free Coffee",
    "description": "Complimentary coffee for loyalty",
    "expiresInDays": 7
  }'
```

### For Users (iOS App)

#### 1. View Coupons
1. Open the Only Coffee app
2. Navigate to "My Coupons" (from profile or home)
3. View active coupons in the "Active" tab
4. View expired/redeemed coupons in the "Expired" tab

#### 2. Enter Promo Code
1. Tap "Enter Promo Code" button
2. Type the promo code (e.g., "WELCOME2025")
3. Tap "Apply Code"
4. See success message and new coupons added

#### 3. Redeem Coupon
1. Find the coupon you want to use
2. Tap "Use Now" button
3. Select items in the menu
4. Coupon will be applied at checkout

---

## 🧪 Testing

### Backend Tests

#### Unit Tests
```bash
cd backend
npm test
```

Test coverage includes:
- Promo code validation
- Coupon grant logic
- Expiry calculations
- Idempotency handling

#### Integration Tests
```bash
npm run test:e2e
```

Test scenarios:
- Create promo code → redeem code → grant coupons
- Redeem coupon on order
- Mark expired coupons (cron simulation)
- Admin endpoints with role guards

### Manual Testing Checklist

#### Backend
- [ ] New user receives 4 starter coupons
- [ ] Promo code redemption works correctly
- [ ] Duplicate redemption prevented (idempotency)
- [ ] Expired coupons cannot be redeemed
- [ ] Coupons expire at 11:59 PM CST
- [ ] Admin can create/view/deactivate promo codes

#### iOS
- [ ] "My Coupons" screen loads and displays coupons
- [ ] Tabs switch between Active and Expired
- [ ] Promo code entry modal works
- [ ] Success/error messages display correctly
- [ ] Coupon details view shows all information
- [ ] Expiring soon coupons show orange badge
- [ ] Expired coupons are grayed out

---

## 🔐 Security Considerations

1. **Authentication**: All endpoints require JWT authentication
2. **Authorization**: Admin endpoints protected with role guards
3. **Idempotency**: Prevents duplicate promo code redemptions
4. **Input Validation**: All DTOs use class-validator
5. **SQL Injection**: TypeORM parameterized queries
6. **Rate Limiting**: Enforced at gateway level

---

## 🚀 Deployment

### Database Migration
```bash
cd backend
npm run typeorm migration:run
```

### Environment Variables
```env
# Backend
DATABASE_URL=postgresql://user:password@host:5432/onlycoffee
JWT_SECRET=your-jwt-secret
TZ=America/Chicago

# iOS (update in CouponsAPIService.swift)
API_BASE_URL=https://api.onlycoffee.com
```

---

## 📊 Metrics & Analytics

The system tracks:
- Total promo codes created
- Total coupon redemptions
- Redemption rate per promo code
- Breakage rate (expired vs redeemed)
- Revenue impact of discounts

Access via admin endpoints:
- `GET /api/v1/v1/admin/promo-codes/:id/stats`
- `GET /api/v1/v1/admin/coupons`

---

## 🎯 Future Enhancements

### Short Term
- [ ] Push notifications for expiring coupons (48h, same-day)
- [ ] Coupon auto-apply at checkout
- [ ] QR code for in-store redemption
- [ ] Coupon sharing/gifting

### Long Term
- [ ] A/B testing for promo campaigns
- [ ] ML-based personalized offers
- [ ] Gamification (spin-to-win, scratch cards)
- [ ] Referral program integration

---

## 📞 Support

For questions or issues:
- Backend: Check logs in CloudWatch
- iOS: Check Xcode console for API errors
- Database: Query `coupon_grants` and `promo_codes` tables

---

**Implementation Date**: October 2025
**Version**: 1.0
**Status**: ✅ Complete (Backend + iOS)
