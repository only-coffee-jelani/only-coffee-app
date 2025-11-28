# Backend Schema Migration Plan

## Overview
This document outlines the complete migration from the old backend schema to the new enterprise schema deployed in AWS.

## Schema Comparison

### OLD SCHEMA (Current Backend Entities)
- users (with many extra fields like marketingOptIn, profileCompleted, etc.)
- stores (with city, state, zipCode, operatingHours as JSONB)
- orders (with deliveryFee, stripePaymentIntentId directly)
- order_items
- menu_items (no category relation)
- categories (separate table)
- rewards_ledger
- gift_cards
- delivery_orders
- reviews
- promotions (simple structure)
- splash_screens (old structure)
- carousel_images (old structure)
- promo_codes
- coupon_grants
- program_events
- user_streaks, streak_visits, streak_saver_tokens, streak_rewards
- anniversary_rewards, user_tier_history, tier_perks
- user_events, user_profiles, user_segment_assignments, user_segments
- ai_promotions, promotion_executions, model_logs
- notification_preferences

### NEW SCHEMA (Enterprise Schema in AWS - 55 Tables)

#### 0. Lookup Tables (9 tables)
1. loyalty_tiers
2. store_types
3. promotion_discount_types
4. payment_methods
5. order_statuses
6. admin_roles
7. user_segments
8. reportable_entities
9. filter_operators

#### 1. Admin & RBAC (4 tables)
10. admin_users
11. admin_roles (lookup)
12. admin_user_roles
13. audit_logs

#### 2. Users & Sessions (4 tables)
14. users (simplified)
15. user_devices
16. user_sessions
17. user_profiles (AI-focused)

#### 3. Stores (3 tables)
18. stores (simplified)
19. store_hours (separate table)
20. store_status_history

#### 4. Menu & Modifiers (6 tables)
21. media_assets (centralized)
22. menu_categories
23. menu_items
24. modifier_groups
25. modifiers
26. menu_item_modifier_groups (junction)

#### 5. Splash & Carousel (3 tables)
27. splash_screens (enhanced)
28. carousels
29. carousel_items

#### 6. Orders & Payments (6 tables)
30. orders (simplified)
31. order_items
32. order_item_modifiers
33. payments (separate table)
34. loyalty_ledger
35. gift_cards

#### 7. Promotions (3 tables)
36. promotions (enhanced)
37. promotion_redemptions
38. promotion_discount_types (lookup)

#### 8. AI & Personalization (6 tables)
39. user_segments (lookup)
40. user_segment_assignments
41. user_events
42. user_profiles
43. ai_predictions
44. ai_recommendations
45. ai_promotions

#### 9. Reporting (7 tables)
46. reportable_entities (lookup)
47. reportable_fields
48. filter_operators (lookup)
49. saved_reports
50. scheduled_reports
51. dim_date
52. dim_store
53. dim_user_segment
54. fact_orders
55. fact_user_events

#### 10. Inventory (2 tables)
56. inventory_items
57. store_inventory_levels

#### 11. Refunds (2 tables)
58. refund_requests
59. refunds

## Key Changes

### Users Table
- REMOVED: city, state, zipCode, role, preferences, isActive, emailVerified, phoneVerified, marketingOptIn, profileCompleted, isLoyaltyMember, notificationsEnabled, deletedAt, verificationCode, verificationCodeExpiry, auth0Id, stripeCustomerId, lastLoginAt, lastActivityDate
- CHANGED: loyaltyTier → loyalty_tier_id (FK to loyalty_tiers)
- CHANGED: loyaltyPoints → loyalty_points
- ADDED: default_store_id (FK to stores)
- SIMPLIFIED: Only core user data

### Stores Table
- REMOVED: city, state, zipCode, operatingHours (JSONB), capacity, acceptingOrders, averageRating, totalReviews, features
- CHANGED: type (enum) → store_type_id (FK to store_types)
- CHANGED: toastLocationId → toast_location_id
- ADDED: opened_at
- NEW TABLE: store_hours (separate table for hours)
- NEW TABLE: store_status_history (track status changes)

### Orders Table
- REMOVED: orderType, toastOrderId, toastCheckId, deliveryFee, paymentMethod (enum), stripePaymentIntentId, pointsEarned, pointsRedeemed, specialInstructions, deliveryInfo, completedAt, cancelledAt
- CHANGED: status (enum) → order_status_id (FK to order_statuses)
- CHANGED: subtotal, tax, total remain
- ADDED: discount_total, payment_method_id (FK), placed_at
- NEW TABLE: payments (separate table for payment details)
- NEW TABLE: order_item_modifiers (for modifiers on order items)

### Menu Items
- REMOVED: Direct category enum
- ADDED: category_id (FK to menu_categories)
- ADDED: image_asset_id (FK to media_assets)
- ADDED: toast_item_id
- NEW TABLES: modifier_groups, modifiers, menu_item_modifier_groups

### Promotions
- ADDED: promotion_discount_type_id (FK)
- ADDED: min_order_value, start_date, end_date, max_redemptions
- ADDED: created_by (FK to admin_users)
- NEW TABLE: promotion_redemptions

## Migration Strategy

### Phase 1: Create New Entities (Priority Order)
1. Lookup tables (enums)
2. Admin tables
3. Core tables (users, stores)
4. Menu tables
5. Order tables
6. AI tables
7. Reporting tables
8. Inventory & Refund tables

### Phase 2: Update DTOs
- Match all DTOs to new entity structures
- Add validation decorators
- Update response DTOs

### Phase 3: Update Services
- Refactor to use new entities
- Update business logic
- Add transaction support

### Phase 4: Update Controllers
- Update endpoints
- Add missing endpoints
- Remove deprecated endpoints

### Phase 5: Migrations
- Remove old migrations
- Generate new migrations
- Test migration execution

## Next Steps
1. Start with lookup table entities
2. Build core entities (admin, users, stores)
3. Build menu and order entities
4. Build AI and reporting entities
5. Update all DTOs
6. Update all services
7. Update all controllers
8. Test compilation
9. Test runtime

