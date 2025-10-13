# Only Coffee API Endpoints

Base URL: `http://localhost:3000/api/v1`

## Authentication Endpoints

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "birthDate": "1990-01-01"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "loyaltyPoints": 0,
    "loyaltyTier": "silver"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 900
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

## User Endpoints

All user endpoints require authentication header:
```
Authorization: Bearer {accessToken}
```

### Get Profile
```http
GET /users/me
```

### Update Profile
```http
PUT /users/me
Content-Type: application/json

{
  "firstName": "Jane",
  "phone": "+1234567890"
}
```

### Get Loyalty Info
```http
GET /users/me/loyalty
```

**Response:**
```json
{
  "points": 1250,
  "tier": "gold",
  "nextTierPoints": 3750
}
```

## Store Endpoints

### Find Nearby Stores
```http
GET /stores/nearby?latitude=37.7749&longitude=-122.4194&radius=10
```

**Query Parameters:**
- `latitude` (required): Latitude coordinate
- `longitude` (required): Longitude coordinate
- `radius` (optional): Search radius in miles (default: 10)

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Downtown Coffee Shop",
    "type": "store",
    "address": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "distance": 0.5,
    "isActive": true,
    "acceptingOrders": true,
    "averageRating": 4.5,
    "operatingHours": {...}
  }
]
```

### Get Store Details
```http
GET /stores/{storeId}
```

## Menu Endpoints

### Get Store Menu
```http
GET /menu/store/{storeId}?category=coffee
```

**Query Parameters:**
- `category` (optional): Filter by category (coffee, espresso, tea, food, pastry)

### Get Categories
```http
GET /menu/store/{storeId}/categories
```

### Search Menu
```http
GET /menu/store/{storeId}/search?q=latte
```

### Get Menu Item
```http
GET /menu/item/{itemId}
```

### Calculate Price with Modifiers
```http
POST /menu/calculate-price
Content-Type: application/json

{
  "itemId": "uuid",
  "modifiers": [
    { "id": "size", "value": "large" },
    { "id": "milk", "value": "oat" },
    { "id": "shots", "value": "2" }
  ]
}
```

**Response:**
```json
{
  "itemId": "uuid",
  "price": 6.75
}
```

## Order Endpoints

All order endpoints require authentication.

### Create Order
```http
POST /orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "storeId": "uuid",
  "items": [
    {
      "menuItemId": "uuid",
      "itemName": "Caffe Latte",
      "quantity": 1,
      "basePrice": 5.50,
      "modifiersPrice": 1.25,
      "totalPrice": 6.75,
      "modifiers": [
        { "name": "Size", "value": "Large", "price": 1.00 },
        { "name": "Milk", "value": "Oat", "price": 0.75 }
      ],
      "specialInstructions": "Extra hot"
    }
  ],
  "orderType": "pickup",
  "pickupTime": "ASAP",
  "specialInstructions": "Please call when ready"
}
```

**Pickup Time Options:**
- `"ASAP"` - Next available slot (usually 8-15 minutes)
- ISO date string - Specific time (e.g., `"2024-10-13T14:30:00Z"`)

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "storeId": "uuid",
  "status": "slot_reserved",
  "subtotal": 6.75,
  "tax": 0.59,
  "total": 7.34,
  "pickupTime": "2024-10-13T14:30:00Z",
  "items": [...]
}
```

### Get Order History
```http
GET /orders/my-orders?limit=20
```

### Get Active Orders
```http
GET /orders/active
```

### Get Order Details
```http
GET /orders/{orderId}
```

### Confirm Order
```http
PUT /orders/{orderId}/confirm
Authorization: Bearer {token}
Content-Type: application/json

{
  "paymentIntentId": "pi_1234567890abcdef"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "confirmed",
  "stripePaymentIntentId": "pi_1234567890abcdef",
  "paymentMethod": "stripe",
  "items": [...],
  "store": {...}
}
```

### Cancel Order
```http
PATCH /orders/{orderId}/cancel
```

## Payment Endpoints

All payment endpoints require authentication.

### Create Payment Intent
```http
POST /payments/create-intent
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": "uuid",
  "amount": 1050,
  "description": "Coffee order payment"
}
```

**Response:**
```json
{
  "clientSecret": "pi_123_secret_456",
  "paymentIntentId": "pi_1234567890abcdef"
}
```

### Confirm Payment
```http
POST /payments/confirm
Authorization: Bearer {token}
Content-Type: application/json

{
  "paymentIntentId": "pi_1234567890abcdef",
  "paymentMethodId": "pm_1234567890abcdef"
}
```

### Get Payment Intent
```http
GET /payments/intent/{paymentIntentId}
Authorization: Bearer {token}
```

### Cancel Payment Intent
```http
DELETE /payments/intent/{paymentIntentId}
Authorization: Bearer {token}
```

### Attach Payment Method
```http
POST /payments/payment-methods/attach
Authorization: Bearer {token}
Content-Type: application/json

{
  "paymentMethodId": "pm_1234567890abcdef"
}
```

### List Payment Methods
```http
GET /payments/payment-methods
Authorization: Bearer {token}
```

### Remove Payment Method
```http
DELETE /payments/payment-methods/{paymentMethodId}
Authorization: Bearer {token}
```

### Stripe Webhook (Public)
```http
POST /payments/webhook
Content-Type: application/json
Stripe-Signature: {signature}

{
  "type": "payment_intent.succeeded",
  "data": {...}
}
```

## Rewards Endpoints

All rewards endpoints require authentication.

### Get Loyalty Summary
```http
GET /rewards/summary
Authorization: Bearer {token}
```

**Response:**
```json
{
  "currentPoints": 1250,
  "currentTier": "gold",
  "nextTier": "platinum",
  "pointsToNextTier": 3750,
  "expiringPointsNext30Days": 100,
  "redemptionValue": 12.00,
  "tierBenefits": [
    "All Silver benefits",
    "Earn 10 points per $1 spent",
    "Priority order processing",
    "Exclusive menu item access"
  ]
}
```

### Get Rewards History
```http
GET /rewards/history?limit=50
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 50)

**Response:**
```json
[
  {
    "id": "uuid",
    "transactionType": "earned",
    "points": 100,
    "balanceAfter": 1250,
    "orderAmount": 10.00,
    "description": "Earned 100 points from order",
    "expiresAt": "2025-10-13T12:00:00Z",
    "createdAt": "2024-10-13T12:00:00Z"
  }
]
```

### Redeem Points
```http
POST /rewards/redeem
Authorization: Bearer {token}
Content-Type: application/json

{
  "points": 500,
  "orderId": "uuid",
  "description": "Redeem points for discount"
}
```

**Points Redemption:**
- Must be in multiples of 500 points
- 500 points = $6.00 discount
- 1000 points = $12.00 discount
- etc.

**Response:**
```json
{
  "ledgerEntry": {
    "id": "uuid",
    "transactionType": "redeemed",
    "points": -500,
    "balanceAfter": 750,
    "description": "Redeemed 500 points for $6.00 discount"
  },
  "discountAmount": 6.00
}
```

### Adjust Points (Admin Only)
```http
POST /rewards/users/{userId}/adjust
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "points": 100,
  "reason": "Compensation for delayed order"
}
```

### Award Birthday Bonus (Admin Only)
```http
POST /rewards/users/{userId}/birthday-bonus
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "id": "uuid",
  "transactionType": "birthday_bonus",
  "points": 250,
  "balanceAfter": 1500,
  "description": "Happy Birthday! Enjoy your bonus points"
}
```

## Health Check

### Health Status
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-10-13T12:00:00Z",
  "service": "gateway-api",
  "version": "1.0.0"
}
```

### Readiness Check
```http
GET /health/ready
```

### Liveness Check
```http
GET /health/live
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Store not found",
    "details": {}
  },
  "timestamp": "2024-10-13T12:00:00Z"
}
```

### Common Error Codes

- `UNAUTHORIZED` - Missing or invalid authentication
- `VALIDATION_ERROR` - Invalid request data
- `NOT_FOUND` - Resource not found
- `SLOT_NOT_AVAILABLE` - Pickup slot full
- `STORE_NOT_ACCEPTING_ORDERS` - Store closed/inactive
- `RATE_LIMIT_EXCEEDED` - Too many requests

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Authenticated**: Higher limits based on user tier
- Header: `X-RateLimit-Remaining`

## API Documentation

Interactive API documentation available at:
- **Swagger UI**: http://localhost:3000/api/docs
- **OpenAPI JSON**: http://localhost:3000/api/docs-json

## Authentication Flow

1. **Register** → Get access token
2. **Store token** → Use for authenticated requests
3. **Token expires** (15 min) → Use refresh token
4. **Refresh token** → Get new access token

## Order Flow

1. **Find stores** → GET /stores/nearby
2. **Get menu** → GET /menu/store/{id}
3. **Calculate price** → POST /menu/calculate-price
4. **Create order** → POST /orders (auto-reserves slot)
5. **Create payment** → POST /payments/create-intent
6. **Process payment** → Client-side Stripe SDK
7. **Confirm order** → PUT /orders/{id}/confirm
8. **Track order** → GET /orders/{id}

## Payment Flow

1. **Create order** → Order created with status `slot_reserved`
2. **Create payment intent** → Get client secret for Stripe
3. **Collect payment** → Use Stripe SDK (iOS/Android) to collect payment details
4. **Process payment** → Stripe processes payment automatically
5. **Confirm order** → Backend confirms order after successful payment
6. **Webhook** → Stripe sends payment_intent.succeeded webhook
7. **Order confirmed** → Status changes to `confirmed`, sent to POS
8. **Points awarded** → User automatically earns loyalty points (10 points per $1)

## Loyalty & Rewards

**Point Earning:**
- Earn **10 points per $1** spent on orders
- Points automatically awarded when payment succeeds
- Bonus points on birthdays (250 points)

**Point Redemption:**
- Redeem in multiples of **500 points**
- **500 points = $6.00** discount
- Can be used on any order

**Loyalty Tiers:**
- **Silver** (0-2,499 points): Base benefits
- **Gold** (2,500-4,999 points): Priority processing, exclusive items
- **Platinum** (5,000+ points): Free delivery, VIP support, early access

**Point Expiration:**
- Points expire **1 year** after earning
- Track expiring points in loyalty summary

## Slot Management

- Slots are **5-minute intervals** from 6 AM to 8 PM
- **ASAP orders** get next available slot (8-15 min prep time)
- Slots **auto-reserved** for 10 minutes during checkout
- **Capacity-based** availability per store
- Auto-release on order cancellation

---

**Built with**: NestJS 11.1.6 | PostgreSQL 16.4 | Redis 8.2
