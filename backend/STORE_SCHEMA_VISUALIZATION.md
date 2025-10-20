# Store Schema Visualization

## Database Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                          STORES TABLE                           │
│                                                                 │
│  Core Info:                                                     │
│  • id (UUID) - Primary Key                                      │
│  • name, type, address, city, state, zipCode                   │
│  • latitude, longitude, phone, email                            │
│  • operatingHours (JSONB), capacity, features (JSONB)          │
│  • isActive, acceptingOrders                                    │
│  • averageRating, totalReviews                                  │
│  • createdAt, updatedAt                                         │
│                                                                 │
│  NEW: Sales & Revenue (7 cols)                                  │
│  NEW: Order Analytics (7 cols)                                  │
│  NEW: Customer Analytics (5 cols)                               │
│  NEW: Product Performance (5 cols)                              │
│  NEW: Performance Metrics (4 cols)                              │
│  NEW: Inventory & Stock (3 cols)                                │
│  NEW: Operational Metrics (6 cols)                              │
│  NEW: Marketing & Promotions (5 cols)                           │
│  NEW: Delivery & Logistics (5 cols)                             │
│  NEW: Financial Metrics (6 cols)                                │
│  NEW: Timestamps & Tracking (2 cols)                            │
│  NEW: Metadata (6 cols)                                         │
│                                                                 │
│  Total: 20 existing + 68 new = 88 columns                       │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         │ 1:N                │ 1:N                │ M:N
         ▼                    ▼                    ▼
    ┌─────────┐          ┌─────────┐      ┌──────────────────┐
    │ ORDERS  │          │ REVIEWS │      │ STORE_MENU_ITEMS │
    │         │          │         │      │ (Junction Table) │
    │ • id    │          │ • id    │      │                  │
    │ • ...   │          │ • ...   │      │ • store_id (FK)  │
    │         │          │         │      │ • menu_item_id   │
    └─────────┘          └─────────┘      │   (FK)           │
                                          │ • created_at     │
                                          └──────────────────┘
                                                   │
                                                   │ M:N
                                                   ▼
                                          ┌──────────────────┐
                                          │  MENU_ITEMS      │
                                          │                  │
                                          │ • id             │
                                          │ • name           │
                                          │ • price          │
                                          │ • ...            │
                                          └──────────────────┘
```

## Column Organization by Category

```
STORES TABLE (88 total columns)
│
├─ CORE INFORMATION (20 existing)
│  ├─ Identification: id, name, type
│  ├─ Location: address, city, state, zipCode, latitude, longitude
│  ├─ Contact: phone, email
│  ├─ Configuration: operatingHours, capacity, features
│  ├─ Status: isActive, acceptingOrders, averageRating, totalReviews
│  └─ Timestamps: createdAt, updatedAt
│
├─ SALES & REVENUE (7 new)
│  ├─ total_orders
│  ├─ total_revenue
│  ├─ total_revenue_today
│  ├─ total_revenue_this_week
│  ├─ total_revenue_this_month
│  ├─ average_order_value
│  └─ highest_order_value
│
├─ ORDER ANALYTICS (7 new)
│  ├─ orders_today
│  ├─ orders_this_week
│  ├─ orders_this_month
│  ├─ completed_orders
│  ├─ cancelled_orders
│  ├─ average_preparation_time
│  └─ average_wait_time
│
├─ CUSTOMER ANALYTICS (5 new)
│  ├─ unique_customers
│  ├─ repeat_customers
│  ├─ new_customers_today
│  ├─ new_customers_this_month
│  └─ customer_retention_rate
│
├─ PRODUCT PERFORMANCE (5 new)
│  ├─ top_selling_item_id
│  ├─ top_selling_item_name
│  ├─ top_selling_item_count
│  ├─ items_sold_today
│  └─ items_sold_this_month
│
├─ PERFORMANCE METRICS (4 new)
│  ├─ order_accuracy_rate
│  ├─ customer_satisfaction_score
│  ├─ on_time_delivery_rate
│  └─ peak_hours (JSONB)
│
├─ INVENTORY & STOCK (3 new)
│  ├─ low_stock_items_count
│  ├─ out_of_stock_items_count
│  └─ last_inventory_check
│
├─ OPERATIONAL METRICS (6 new)
│  ├─ staff_count
│  ├─ is_open_now
│  ├─ last_opened_at
│  ├─ last_closed_at
│  ├─ total_downtime_minutes
│  └─ operational_efficiency_score
│
├─ MARKETING & PROMOTIONS (5 new)
│  ├─ active_promotions_count
│  ├─ total_promotions_used
│  ├─ promotion_revenue
│  ├─ loyalty_program_members
│  └─ loyalty_points_redeemed
│
├─ DELIVERY & LOGISTICS (5 new)
│  ├─ delivery_orders_count
│  ├─ pickup_orders_count
│  ├─ dine_in_orders_count
│  ├─ average_delivery_time
│  └─ delivery_success_rate
│
├─ FINANCIAL METRICS (6 new)
│  ├─ cost_of_goods_sold
│  ├─ gross_profit
│  ├─ gross_profit_margin
│  ├─ operating_expenses
│  ├─ net_profit
│  └─ net_profit_margin
│
├─ TIMESTAMPS & TRACKING (2 new)
│  ├─ last_analytics_update
│  └─ last_sales_report
│
├─ METADATA (6 new)
│  ├─ store_image_url
│  ├─ description
│  ├─ notes
│  ├─ manager_name
│  ├─ manager_phone
│  └─ manager_email
│
└─ RELATIONS
   ├─ 1:N → Orders
   ├─ 1:N → Reviews
   └─ M:N → MenuItems (via store_menu_items)
```

## Data Flow for Analytics

```
┌──────────────────────────────────────────────────────────────┐
│                    ANALYTICS DATA FLOW                       │
└──────────────────────────────────────────────────────────────┘

1. ORDER PLACEMENT
   Customer places order
        ↓
   Order created in ORDERS table
        ↓
   Trigger updates STORES table:
   • total_orders += 1
   • total_revenue += order_amount
   • orders_today += 1
   • average_order_value recalculated

2. CUSTOMER TRACKING
   Order linked to customer
        ↓
   Check if repeat customer
        ↓
   Update STORES table:
   • unique_customers (if new)
   • repeat_customers (if returning)
   • new_customers_today (if new)
   • customer_retention_rate recalculated

3. PRODUCT TRACKING
   Order items recorded
        ↓
   Track item sales
        ↓
   Update STORES table:
   • items_sold_today += count
   • items_sold_this_month += count
   • top_selling_item_id updated
   • top_selling_item_count updated

4. DELIVERY/FULFILLMENT
   Order fulfilled
        ↓
   Track fulfillment type & time
        ↓
   Update STORES table:
   • delivery_orders_count / pickup_orders_count / dine_in_orders_count
   • average_preparation_time updated
   • average_delivery_time updated
   • completed_orders += 1

5. DAILY AGGREGATION JOB
   Runs at end of day
        ↓
   Calculate daily metrics
        ↓
   Update STORES table:
   • total_revenue_today → total_revenue_this_week
   • total_revenue_this_week → total_revenue_this_month
   • Reset daily counters
   • Calculate efficiency scores
   • Generate reports

6. REPORTING
   Admin requests analytics
        ↓
   Query STORES table
        ↓
   Display dashboards & reports
```

## Index Strategy

```
INDEXES CREATED (6 total)

1. idx_stores_total_revenue
   Purpose: Revenue-based sorting and filtering
   Query: ORDER BY total_revenue DESC
   
2. idx_stores_total_orders
   Purpose: Order-based sorting and filtering
   Query: ORDER BY total_orders DESC
   
3. idx_stores_is_open_now
   Purpose: Find currently open stores
   Query: WHERE is_open_now = true
   
4. idx_stores_average_rating
   Purpose: Rating-based sorting
   Query: ORDER BY averageRating DESC
   
5. idx_stores_is_active
   Purpose: Filter active stores
   Query: WHERE isActive = true
   
6. idx_stores_created_at
   Purpose: Date-based sorting
   Query: ORDER BY createdAt DESC
```

## Menu Integration

```
STORE ↔ MENU_ITEMS RELATIONSHIP

┌─────────────────────────────────────────────────────────────┐
│                    STORE_MENU_ITEMS                         │
│                   (Junction Table)                          │
│                                                             │
│  store_id (UUID) ──────┐                                    │
│  menu_item_id (UUID) ──┤                                    │
│  created_at (timestamp)│                                    │
│                        │                                    │
│  PRIMARY KEY: (store_id, menu_item_id)                      │
│  FOREIGN KEY: store_id → stores.id                          │
│  FOREIGN KEY: menu_item_id → menu_items.id                  │
└─────────────────────────────────────────────────────────────┘

EXAMPLE DATA:
┌──────────────────────────────────────────────────────────────┐
│ store_id                 │ menu_item_id             │ created_at
├──────────────────────────────────────────────────────────────┤
│ store-uuid-1             │ cappuccino-uuid          │ 2024-01-01
│ store-uuid-1             │ espresso-uuid            │ 2024-01-01
│ store-uuid-1             │ latte-uuid               │ 2024-01-01
│ store-uuid-2             │ cappuccino-uuid          │ 2024-01-02
│ store-uuid-2             │ americano-uuid           │ 2024-01-02
│ store-uuid-3             │ cappuccino-uuid          │ 2024-01-03
└──────────────────────────────────────────────────────────────┘

QUERIES:
• Get all menu items at a store
• Get all stores selling a menu item
• Add/remove items from store
• Track item availability per store
```

## Summary

✅ **88 Total Columns** (20 existing + 68 new)
✅ **12 Categories** of analytics
✅ **6 Strategic Indexes** for performance
✅ **3 Relationships** (2 existing + 1 new M:N)
✅ **1 Junction Table** for menu integration
✅ **Comprehensive Tracking** for all business metrics

