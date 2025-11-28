# Developer Guide - New Enterprise Schema

## 🚀 Quick Start

### Database Connection
The database is already configured in `backend/services/gateway/.env`:
```
DB_HOST=only-coffee-db.cu96ksosqdq2.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=Dieb4utr1I!
DB_DATABASE=only_coffee
DB_SSL=true
```

### Available NPM Scripts
```bash
cd backend/services/gateway

# Backup media assets
npm run db:backup

# Rebuild entire database (drop, create, seed, migrate)
npm run db:rebuild

# Individual steps
npm run db:rebuild-schema  # Drop old + create new schema
npm run db:seed            # Seed lookup tables
npm run db:migrate-media   # Migrate media assets
```

---

## 📊 Key Schema Changes

### 1. Centralized Media Management
**OLD:**
```sql
SELECT imageUrl FROM splash_screens WHERE id = '...';
```

**NEW:**
```sql
SELECT m.url, m.alt_text, m.type
FROM splash_screens s
JOIN media_assets m ON s.image_asset_id = m.asset_id
WHERE s.splash_id = '...';
```

### 2. Menu Items with Categories
**OLD:**
```sql
SELECT * FROM menu_items WHERE category = 'signature';
```

**NEW:**
```sql
SELECT mi.*, mc.name as category_name, m.url as image_url
FROM menu_items mi
JOIN menu_categories mc ON mi.category_id = mc.category_id
LEFT JOIN media_assets m ON mi.image_asset_id = m.asset_id
WHERE mc.name = 'signature';
```

### 3. Carousel Structure
**OLD:**
```sql
SELECT * FROM carousel_images ORDER BY position;
```

**NEW:**
```sql
SELECT ci.*, m.url as image_url
FROM carousel_items ci
JOIN carousels c ON ci.carousel_id = c.carousel_id
LEFT JOIN media_assets m ON ci.image_asset_id = m.asset_id
WHERE c.is_active = true
ORDER BY ci.position;
```

### 4. Orders with Items
**NEW:**
```sql
-- Get order with items and modifiers
SELECT 
  o.order_id,
  o.total_amount,
  oi.menu_item_id,
  oi.quantity,
  oi.subtotal,
  oim.modifier_id,
  m.name as modifier_name,
  oim.price_delta
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
LEFT JOIN order_item_modifiers oim ON oi.order_item_id = oim.order_item_id
LEFT JOIN modifiers m ON oim.modifier_id = m.modifier_id
WHERE o.order_id = '...';
```

---

## 🔑 Important Tables

### Core Tables
- `users` - Customer accounts
- `stores` - Store locations
- `menu_items` - Menu items
- `orders` - Customer orders
- `media_assets` - **All images stored here**

### Lookup Tables (Pre-seeded)
- `loyalty_tiers` - Bronze, Silver, Gold, Platinum
- `store_types` - Flagship, Standard, Kiosk, Pop-up
- `payment_methods` - Credit Card, Debit Card, Apple Pay, Google Pay, Gift Card
- `order_statuses` - Pending, Confirmed, Preparing, Ready, Completed, Cancelled
- `admin_roles` - Super Admin, Store Manager, Barista, Marketing Manager, Analyst

### New Enterprise Features
- `admin_users` + `admin_roles` - RBAC system
- `audit_logs` - Complete audit trail
- `ai_predictions` + `ai_recommendations` - AI/ML
- `user_segments` - User segmentation
- `saved_reports` - Self-service reporting
- `inventory_items` - Inventory management
- `refund_requests` - Refund processing

---

## 🛠️ Common Queries

### Get Active Splash Screen
```sql
SELECT s.*, m.url as image_url
FROM splash_screens s
LEFT JOIN media_assets m ON s.image_asset_id = m.asset_id
WHERE s.is_active = true
  AND (s.start_at IS NULL OR s.start_at <= NOW())
  AND (s.end_at IS NULL OR s.end_at >= NOW())
ORDER BY s.created_at DESC
LIMIT 1;
```

### Get Active Carousel
```sql
SELECT c.carousel_id, c.name, ci.position, ci.title, ci.subtitle, m.url as image_url
FROM carousels c
JOIN carousel_items ci ON c.carousel_id = ci.carousel_id
LEFT JOIN media_assets m ON ci.image_asset_id = m.asset_id
WHERE c.is_active = true
ORDER BY ci.position;
```

### Get Menu Items by Category
```sql
SELECT 
  mi.menu_item_id,
  mi.name,
  mi.description,
  mi.base_price,
  mc.name as category,
  m.url as image_url
FROM menu_items mi
JOIN menu_categories mc ON mi.category_id = mc.category_id
LEFT JOIN media_assets m ON mi.image_asset_id = m.asset_id
WHERE mi.is_active = true
ORDER BY mc.name, mi.name;
```

### Create Order with Items
```sql
-- 1. Insert order
INSERT INTO orders (user_id, store_id, order_status_id, total_amount)
VALUES ('...', '...', (SELECT status_id FROM order_statuses WHERE name = 'Pending'), 10.50)
RETURNING order_id;

-- 2. Insert order items
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal)
VALUES ('...', '...', 1, 9.50, 9.50)
RETURNING order_item_id;

-- 3. Insert modifiers (if any)
INSERT INTO order_item_modifiers (order_item_id, modifier_id, price_delta)
VALUES ('...', '...', 1.00);
```

---

## ⚠️ Breaking Changes

### Column Name Changes
- `id` → `{table}_id` (e.g., `menu_item_id`, `order_id`)
- `image_url` → `image_asset_id` (foreign key to `media_assets`)
- `category` → `category_id` (foreign key to `menu_categories`)
- `store_ids` (array) → Still array, but consider using junction table for many-to-many

### Table Name Changes
- `categories` → `menu_categories`
- `carousel_images` → `carousel_items` (with parent `carousels` table)

### New Required Fields
- Most tables now have `created_at` and `updated_at` timestamps
- Many tables have `is_active` boolean flags
- Foreign keys are enforced with `ON DELETE CASCADE` or `ON DELETE SET NULL`

---

## 🧪 Testing

### Verify Database State
```bash
cd backend/services/gateway
npx ts-node -r tsconfig-paths/register ../../database/scripts/verify-rebuild.ts
```

### Check Table Counts
```sql
SELECT 
  schemaname,
  tablename,
  (SELECT COUNT(*) FROM pg_catalog.pg_class c WHERE c.relname = tablename) as row_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## 📚 Additional Resources

- **Full Schema:** `backend/database/sql/enterprise-schema.sql`
- **Rebuild Summary:** `backend/database/REBUILD_COMPLETE.md`
- **Backup File:** `backend/database/backups/media-backup-2025-11-24T23-37-37-475Z.json`

---

**Last Updated:** November 24, 2025

