# Only Coffee Loyalty System Specification

**App Features to Build**
- Morning Rush Multiplier  
- Streak Saver Tokens  
- Anniversary Rewards  
- Core Streaks & Tiers (baseline logic)  
- Rewards catalog, accrual, redemption, notifications, analytics, admin controls  

**Tech Stack**
- Backend: TypeScript (Node 20, Express, Prisma ORM, PostgreSQL)  
- Frontend: React Native  
- Timezone: America/Chicago  

Write production-grade code with tests.

---

## 0. Global Principles

- All date/time logic uses TZ **America/Chicago** (`luxon`).
- Idempotency: all write endpoints accept `Idempotency-Key` header; dedupe by `(user_id, key)`.
- Security: JWT auth middleware; role-based access (`user`, `admin`).
- Observability: structured logs (`pino`), metrics (`prom-client`), traces (`OpenTelemetry`).
- Migrations via Prisma; seed scripts included.
- Feature flags via `config.loyalty.*` (read from DB + env).

---

## 1. Program Rules (Business Logic)

### Streak Definition
- A “visit” is a **paid order ≥ $3**.
- Max **1 visit/day** counts toward streak.
- **Streak = consecutive days with a qualifying visit**.
- Rewards **expire in 7 days** unless otherwise stated.

### Morning Rush Multiplier
- Qualifying purchases **between 5:00–10:00 AM (local)** count as **2 streak credits** for that day.  
- Applies to *monthly streak points* and *tier XP*, not consecutive-day count.  
- Expose counters:  
  - `consecutive_days`  
  - `monthly_points` (double points apply)  
  - `tier_xp` (double XP apply)

### Streak Saver Tokens
- Each user gets **1 token/month** automatically on the 1st.  
- A token may be **applied to exactly one missed day** in the current month to preserve `consecutive_days`.  
- Limit: **2 tokens per rolling 90 days**.  
- Token cannot apply to a day with an existing qualifying purchase.

### Anniversary Rewards
- On **member anniversary** (1 year since first qualifying purchase):  
  - Grant **Free drink up to $8** + **“Year One” badge**.  
  - Reward expires in **14 days**.  
  - Repeat yearly (Year Two badge, etc.).  
- If no purchase history, use account creation date.

### Baseline Streak Rewards
| Streak | Reward | Cap |
|--------|---------|-----|
| Day 2 (Hook) | Free drink | ≤ $6 |
| 7-Day | 50% off drink | ≤ $7 |
| 14-Day | Free upgrade | ≤ $3 |
| 30-Day | Free drink | ≤ $8 |
| 90-Day | Exclusive reusable cup / merch | Custom |

All expire in 7 days. One active redemption at a time.

### Tiers
| Tier | Requirement | Perks |
|------|--------------|-------|
| Bronze | Default | Streak rewards |
| Silver | 14+ visits/mo or 2× 7-day streaks | 10% off 1 drink/week |
| Gold | 3 months of Silver in last 4 | 15% off all drinks + early access |
| Platinum | 6 months of Gold in last 8 | Free drink on 1st of month (≤$8) |
| Black | 12-month streak or $1000 annual spend | 20% off all year + “No-Wait” |

Tier evaluation runs nightly; perks time-boxed.

### Anti-gaming / Profit Guards
- Minimum ticket: $3.
- Only 1 streak reward redeemed/week.
- Reward catalog enforces price caps & eligible SKUs.
- Morning Multiplier boosts XP & monthly points, not day count.

---

## 2. Data Model (Prisma)

```prisma
(model schema omitted for brevity—same as earlier section)
```

---

## 3. Core Algorithms (Pseudocode)

(Same as earlier section)

---

## 4. API Endpoints

(Same as earlier section)

---

## 5. Mobile UI (React Native)

(Same as earlier section)

---

## 6. Analytics & Reporting

(Same as earlier section)

---

## 7. Tests

(Same as earlier section)

---

## 8. Seed & Fixtures

(Same as earlier section)

---

## 9. Config Defaults

(Same as earlier section)

---

## 10. Deliverables

(Same as earlier section)
