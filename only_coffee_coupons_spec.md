# Only Coffee Coupon & Promo Code System Specification

**App Features to Build**
- Promo Code System (creation, validation, redemption)
- “My Coupons” section in user profile
- Coupon creation and assignment (from promo codes & loyalty rewards)
- Redemption rules for app and in-person
- Expiration visibility, UX, and notifications

**Tech Stack**
- Backend: TypeScript (Node 20, Express, Prisma ORM, PostgreSQL)
- Frontend: React Native
- Timezone: America/Chicago

Write production-grade code with tests.

---

## 0. Global Principles

- All date/time logic uses TZ **America/Chicago** (`luxon`).
- Coupons and promo codes are atomic: one-time use per coupon.
- Idempotency: all write endpoints accept `Idempotency-Key`.
- Promo codes can generate **multiple coupon types** or **limited batches**.
- Security: JWT auth middleware, `admin` role for coupon creation.
- Logging via `pino`, metrics via `prom-client`, OpenTelemetry tracing.
- All coupon grants and redemptions emit `ProgramEvent`.

---

## 1. Program Rules (Business Logic)

### Coupon Types (Initial)
| Name | Description | Value | Validity | Restrictions |
|------|--------------|--------|-----------|---------------|
| **50% Off Coupon** | 50% discount on any drink | 50% | 7 days | Waffolino excluded |
| **First Sip Coupon** | First drink for **$1.99** | Price override | 7 days | Excludes Waffolino / Pistacchio variants |
| **Promo Code Coupon** | Created by code entry | Varies | Configurable | Configurable |
| **Loyalty Coupon** | Granted via loyalty rewards | Varies | Configurable | Same as promo coupons |

### Core Behavior

- Coupons are **single-use** unless otherwise configured.
- All coupons display:
  - Name, value, expiry date, eligible items, redemption channel (“App Only” / “In-Store”).
- Users can hold multiple active coupons.
- Expired coupons are auto-archived but remain viewable (gray state).
- Coupons may be **auto-applied** if applicable at checkout (configurable flag).
- Rewards and coupons share redemption constraints:
  - Cannot combine multiple coupons or coupons + streak reward on the same order.

---

## 2. “My Coupons” Section (App UI)

### Features

1. **Promo Code Entry**
   - Field to enter text code (case-insensitive).
   - Valid codes create associated coupon(s) in user wallet.
   - Invalid or expired codes display “This code is no longer valid.”

2. **Coupon Wallet UI**
   - Active tab: current usable coupons.
   - Expired tab: gray, view-only coupons (past 90 days).
   - Each coupon card shows:
     - Icon, name (“50% Off Drink”), short description.
     - Expiration date/time clearly (e.g. “Expires in 2 days” or “Expires Oct 23, 11:59 PM”).
     - Redemption channel badge: “App Only” / “In-Store or App”.
     - “Use Now” button → redeem endpoint.

3. **Visual Hierarchy**
   - Soon-to-expire coupons surface to top.
   - Animated countdown (optional) in last 24 hours.
   - Expired coupons fade to 40% opacity, disabled “Use Now.”

---

## 3. Coupon & Promo Code System Rules

### Coupon Generation Sources

| Source | Description | Trigger |
|---------|--------------|----------|
| **Promo Code Entry** | User enters a public or campaign code | Manual input |
| **Loyalty Reward** | User hits a milestone (streak/tier) | Auto-grant |
| **Admin Campaign** | Marketing pushes batch codes | Admin panel |
| **Referral** | Friend signup or invite | Referral module |

### Coupon Lifecycle

1. **Create / Grant** → record createdAt, expiresAt.
2. **Display in App** → visible in “My Coupons.”
3. **Redeem** → user applies at checkout (app or POS).
4. **Consume** → marked `REDEEMED`; cannot reuse.
5. **Expire** → nightly job sets expired coupons to `EXPIRED` if past expiry.

---

## 4. Data Model (Prisma)

```prisma
model PromoCode {
  id          String   @id @default(cuid())
  code        String   @unique
  description String?
  type        PromoType
  createdBy   String?
  maxUses     Int?
  usedCount   Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  expiresAt   DateTime?
  coupons     CouponGrant[]
}

model CouponGrant {
  id           String   @id @default(cuid())
  userId       String?  @index
  user         User?    @relation(fields: [userId], references: [id])
  promoCodeId  String?  @index
  promoCode    PromoCode? @relation(fields: [promoCodeId], references: [id])
  type         CouponType
  label        String
  description  String?
  valueCents   Int?
  percentOff   Int?
  priceOverrideCents Int?
  eligibleItems Json?
  channels     String
  expiresAt    DateTime
  redeemedAt   DateTime?
  status       CouponStatus @default(ACTIVE)
  source       String
  createdAt    DateTime @default(now())
}

enum CouponType { PERCENT_OFF FIXED_PRICE FIXED_AMOUNT FREE_ITEM }
enum CouponStatus { ACTIVE REDEEMED EXPIRED CANCELLED }
enum PromoType { SINGLE_USE MULTI_USE UNLIMITED }
```

---

## 5. Promo Code Logic (Backend)

### Creation (Admin)
- Endpoint: `POST /v1/admin/promo-codes`
- Body:
```json
{
  "code": "WELCOME2025",
  "type": "MULTI_USE",
  "maxUses": 500,
  "expiresAt": "2025-12-31T23:59:59Z",
  "coupons": [
    {"type": "PERCENT_OFF", "percentOff": 50, "label": "50% Off Drink", "expiresInDays": 7},
    {"type": "FIXED_PRICE", "priceOverrideCents": 199, "label": "First Sip", "expiresInDays": 7, "eligibleItems": {"exclude":["waffolino","pistacchio"]}}
  ]
}
```

### Redemption (User)
- Endpoint: `POST /v1/coupons/redeem-code`
- Body: `{ "code": "WELCOME2025" }`
- Validations:
  - Promo code exists, active, not expired.
  - Uses < maxUses (if defined).
  - If success → generate CouponGrant(s) for user with calculated `expiresAt`.
  - Increment `usedCount`.

### Coupon Use
- Endpoint: `POST /v1/coupons/redeem`
- Body: `{ "couponId": "abc123", "orderId": "xyz987" }`
- Validations:
  - Coupon belongs to user.
  - Status = ACTIVE.
  - Not expired.
  - Item in order is eligible.
  - Channel (app / in-store) matches.
- On success: mark `REDEEMED`, create `ProgramEvent` with payload `{ couponId, type, orderId }`.

---

## 6. Initial Seed Data (Default Coupons)

On first deployment, seed 4 coupons for all new users (auto-grant):

| Coupon | Type | Value | Expiration | Restrictions |
|---------|------|--------|-------------|--------------|
| 50% Off #1 | PERCENT_OFF | 50% | 7 days | Waffolino excluded |
| 50% Off #2 | PERCENT_OFF | 50% | 7 days | Waffolino excluded |
| First Sip #1 | FIXED_PRICE | $1.99 | 7 days | Waffolino excluded |
| First Sip #2 | FIXED_PRICE | $1.99 | 7 days | Waffolino excluded |

Coupons expire **exactly at 11:59 PM CST on the 7th day**.

---

## 7. UI/UX Notes

**My Coupons Page**
- Title: “My Coupons”
- Subsection: “Enter Promo Code”
  - Text input + Submit button.
  - Success toast: “✅ 2 new coupons added! Expires in 7 days.”
  - Error toast: “This promo code is invalid or expired.”

**Coupon Card**
```
[50% OFF]  Cappuccino, Flat White, or Latte
Expires in 3 days — App or In-Store
Button: Use Now
```

**Empty State**
> “No active coupons yet. Enter a promo code or earn rewards through your loyalty streak!”

**Expiration Reminders**
- 48 hours before expiry → push notification “Use your 50% Off coupon before it’s gone!”
- Expiry day morning → push “Last chance to enjoy your $1.99 First Sip today!”

---

## 8. Analytics & Admin Dashboard

Admin metrics:
- Codes created, total uses, redemptions, and revenue impact.
- Breakdown by coupon type (50% Off vs Fixed Price).
- Redemption channel split (app vs in-store).
- Expiry rate (“breakage”).

Events tracked:
- Promo code redeemed
- Coupon granted
- Coupon redeemed
- Coupon expired

Admin endpoints:
- `GET /v1/admin/promo-codes`
- `GET /v1/admin/coupons`
- `POST /v1/admin/coupons/grant` (manual user grant)

---

## 9. Config Defaults

```ts
couponConfig = {
  tz: "America/Chicago",
  defaultValidityDays: 7,
  defaultStartCoupons: [
    { type: "PERCENT_OFF", percentOff: 50, label: "50% Off Drink", expiresInDays: 7 },
    { type: "PERCENT_OFF", percentOff: 50, label: "50% Off Drink", expiresInDays: 7 },
    { type: "FIXED_PRICE", priceOverrideCents: 199, label: "First Sip", expiresInDays: 7, eligibleItems: { exclude: ["waffolino","pistacchio"] }},
    { type: "FIXED_PRICE", priceOverrideCents: 199, label: "First Sip", expiresInDays: 7, eligibleItems: { exclude: ["waffolino","pistacchio"] }}
  ],
  promoCodeLimits: { maxUses: 10000, defaultType: "MULTI_USE" },
  autoApply: false
}
```

---

## 10. Deliverables

- Prisma schema + migrations  
- Express routes (`/v1/coupons`, `/v1/promo-codes`)  
- React Native “My Coupons” screen + promo code entry flow  
- Daily cron job for expiry cleanup  
- Notification service for expiration alerts  
- Admin dashboard for code/coupon management  
- Unit + integration tests for promo code redemption, expiry, and redemption logic  
- README with setup instructions  

**All code must follow Only Coffee codebase style and be production-ready.**
