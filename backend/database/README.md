# Only Coffee - Database Rebuild Guide

This guide explains how to rebuild the Only Coffee database with the new enterprise-grade schema while preserving all existing media assets (splash screens, carousel images, menu item images, and promotions).

## Overview

The database rebuild process consists of 4 main steps:

1. **Backup** - Export all existing media assets and data to JSON
2. **Drop** - Drop all existing tables from the old schema
3. **Create** - Create the new enterprise schema with 60+ tables
4. **Seed** - Populate lookup tables with initial data
5. **Migrate** - Import media assets into the new schema structure

## Prerequisites

- Node.js and npm installed
- Access to AWS RDS PostgreSQL database
- Environment variables configured in `backend/services/gateway/.env`
- Backend dependencies installed (`npm install` in `backend/services/gateway`)

## Quick Start

### Option 1: Run All Steps at Once

```bash
cd backend/services/gateway
npm run db:rebuild
```

This single command will:
1. Backup all media assets
2. Run migrations (drop old schema + create new schema)
3. Seed lookup tables
4. Migrate media assets to new structure

### Option 2: Run Steps Individually

If you prefer more control, run each step separately:

```bash
cd backend/services/gateway

# Step 1: Backup existing media assets
npm run db:backup

# Step 2: Run migrations (drop + create)
npm run migration:run

# Step 3: Seed lookup tables
npm run db:seed

# Step 4: Migrate media assets
npm run db:migrate-media
```

## What Gets Preserved

The following data will be preserved and migrated to the new schema:

### Splash Screens
- ✅ All splash screen images
- ✅ Titles and descriptions
- ✅ Display durations
- ✅ Date ranges (start/end dates)
- ✅ Active status
- ✅ Target URLs/deeplinks
- ✅ Creation timestamps

### Carousel Images
- ✅ All carousel images
- ✅ Titles and descriptions
- ✅ Image dimensions
- ✅ Position/sort order
- ✅ Target URLs/deeplinks
- ✅ Date ranges
- ✅ Active status

### Menu Items
- ✅ All menu item images
- ✅ Names and descriptions
- ✅ Base prices
- ✅ Categories
- ✅ Store assignments
- ✅ Active status

### Promotions
- ✅ All promotion images
- ✅ Names and descriptions
- ✅ Discount values and types
- ✅ Date ranges
- ✅ Active status

## New Schema Features

The new enterprise schema includes:

### Core Tables
- **Admin & RBAC**: admin_users, admin_roles, admin_user_roles, audit_logs
- **Users**: users, user_devices, user_sessions
- **Stores**: stores, store_hours, store_status_history
- **Menu**: menu_categories, menu_items, modifier_groups, modifiers
- **Media**: media_assets (centralized image management)

### Orders & Payments
- orders, order_items, order_item_modifiers
- payments, loyalty_ledger, gift_cards

### Promotions & Loyalty
- promotions, promotion_redemptions
- loyalty_tiers (Bronze, Silver, Gold, Platinum)

### AI & Personalization
- user_segments, user_segment_assignments
- user_events, user_profiles
- ai_predictions, ai_recommendations, ai_promotions

### Reporting & Analytics
- reportable_entities, reportable_fields, filter_operators
- saved_reports, scheduled_reports
- dim_date, dim_store, dim_user_segment
- fact_orders, fact_user_events

### Inventory Management
- inventory_items, store_inventory_levels

### Refunds
- refund_requests, refunds

## Lookup Tables

The following lookup tables are automatically seeded:

- **loyalty_tiers**: Bronze, Silver, Gold, Platinum
- **store_types**: coffee_shop, food_truck, kiosk, popup
- **promotion_discount_types**: fixed, percent
- **payment_methods**: card, apple_pay, google_pay, loyalty_points, gift_card
- **order_statuses**: pending, confirmed, preparing, ready, completed, cancelled
- **admin_roles**: super_admin, ops_manager, marketer, analyst, store_manager
- **user_segments**: new_users, active_users, at_risk, high_value, loyalty_members, weekend_warriors, morning_regulars

## Backup Files

Backup files are stored in `backend/database/backups/` with the format:
```
media-backup-YYYY-MM-DD-HH-MM-SS.json
```

The backup includes:
- All splash screens with image URLs
- All carousel images with image URLs
- All menu items with image URLs
- All promotions with image URLs
- Backup timestamp

## Troubleshooting

### Migration Fails

If the migration fails partway through:

1. Check the error message
2. Restore from backup if needed
3. Fix the issue
4. Run `npm run migration:revert` to undo the last migration
5. Try again with `npm run migration:run`

### Missing Backup File

If you see "No backup file found":

1. Run `npm run db:backup` first
2. Check that `backend/database/backups/` directory exists
3. Verify the backup file was created

### Connection Issues

If you can't connect to the database:

1. Check your `.env` file has correct credentials
2. Verify AWS RDS security group allows your IP
3. Test connection with: `psql -h <host> -U postgres -d only_coffee`

## Rollback

⚠️ **WARNING**: The migrations cannot be automatically reversed!

To rollback to the old schema:
1. Restore from a PostgreSQL backup taken before running migrations
2. Or manually recreate the old schema from the old migration files

## Next Steps

After rebuilding the database:

1. ✅ Update TypeORM entities to match new schema
2. ✅ Update API endpoints to use new table structures
3. ✅ Test all CRUD operations
4. ✅ Update admin website to work with new schema
5. ✅ Update mobile apps to work with new API responses
6. ✅ Run integration tests

## Support

For issues or questions, contact the development team.

