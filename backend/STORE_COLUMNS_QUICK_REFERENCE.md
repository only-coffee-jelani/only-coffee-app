# Store Columns Quick Reference

## All 68 New Columns at a Glance

### Sales & Revenue (7)
```
total_orders                    → Total orders placed
total_revenue                   → All-time revenue
total_revenue_today             → Today's revenue
total_revenue_this_week         → This week's revenue
total_revenue_this_month        → This month's revenue
average_order_value             → Average $ per order
highest_order_value             → Highest single order $
```

### Order Analytics (7)
```
orders_today                    → Orders placed today
orders_this_week                → Orders this week
orders_this_month               → Orders this month
completed_orders                → Total completed
cancelled_orders                → Total cancelled
average_preparation_time        → Avg prep time (min)
average_wait_time               → Avg wait time (min)
```

### Customer Analytics (5)
```
unique_customers                → Total unique customers
repeat_customers                → Customers who ordered 2+
new_customers_today             → New customers today
new_customers_this_month        → New customers this month
customer_retention_rate         → % of repeat customers
```

### Product Performance (5)
```
top_selling_item_id             → UUID of best seller
top_selling_item_name           → Name of best seller
top_selling_item_count          → Times sold
items_sold_today                → Items sold today
items_sold_this_month           → Items sold this month
```

### Performance Metrics (4)
```
order_accuracy_rate             → % accurate orders
customer_satisfaction_score     → Score 0-5
on_time_delivery_rate           → % on-time
peak_hours                      → JSON: {"12:00": 45}
```

### Inventory & Stock (3)
```
low_stock_items_count           → Items running low
out_of_stock_items_count        → Items out of stock
last_inventory_check            → Last check timestamp
```

### Operational Metrics (6)
```
staff_count                     → Number of staff
is_open_now                     → Currently open?
last_opened_at                  → Last open time
last_closed_at                  → Last close time
total_downtime_minutes          → Total downtime
operational_efficiency_score    → Efficiency %
```

### Marketing & Promotions (5)
```
active_promotions_count         → Active promos
total_promotions_used           → Times redeemed
promotion_revenue               → Revenue from promos
loyalty_program_members         → Loyalty members
loyalty_points_redeemed         → Points redeemed
```

### Delivery & Logistics (5)
```
delivery_orders_count           → Delivery orders
pickup_orders_count             → Pickup orders
dine_in_orders_count            → Dine-in orders
average_delivery_time           → Avg delivery (min)
delivery_success_rate           → % successful
```

### Financial Metrics (6)
```
cost_of_goods_sold              → COGS $
gross_profit                    → Revenue - COGS
gross_profit_margin             → Gross profit %
operating_expenses              → Operating costs $
net_profit                      → Profit after expenses
net_profit_margin               → Net profit %
```

### Timestamps & Tracking (2)
```
last_analytics_update           → Last calc time
last_sales_report               → Last report time
```

### Metadata (6)
```
store_image_url                 → Store image URL
description                     → Store description
notes                           → Internal notes
manager_name                    → Manager name
manager_phone                   → Manager phone
manager_email                   → Manager email
```

## Column Data Types

| Type | Columns | Example |
|------|---------|---------|
| `int` | counts, times | 100, 45 |
| `decimal(12,2)` | money | 1234.56 |
| `decimal(5,2)` | percentages | 95.50 |
| `decimal(3,2)` | ratings | 4.50 |
| `boolean` | flags | true |
| `timestamptz` | dates | 2024-01-01T00:00:00Z |
| `jsonb` | complex | {"key": value} |
| `varchar(255)` | text | "Store Name" |
| `text` | long text | Description... |
| `uuid` | IDs | UUID string |

## Existing Columns (Not New)

These columns were already in the stores table:
```
id                              → UUID primary key
name                            → Store name
type                            → STORE, TRUCK, KIOSK
toastLocationId                 → POS integration ID
address                         → Street address
city                            → City name
state                           → State/Province
zipCode                         → Postal code
latitude                        → Geographic latitude
longitude                       → Geographic longitude
phone                           → Store phone
email                           → Store email
operatingHours                  → JSONB hours
capacity                        → Max orders per slot
isActive                        → Is active?
acceptingOrders                 → Accepting orders?
averageRating                   → Rating 0-5
totalReviews                    → Review count
features                        → JSONB features
createdAt                       → Created timestamp
updatedAt                       → Updated timestamp
```

## Relationships

### One-to-Many
- Store → Orders (one store has many orders)
- Store → Reviews (one store has many reviews)

### Many-to-Many (NEW)
- Store ↔ MenuItem (through `store_menu_items` table)
  - One store has many menu items
  - One menu item available at many stores

## Indexes for Performance

```
idx_stores_total_revenue        → Revenue sorting
idx_stores_total_orders         → Order sorting
idx_stores_is_open_now          → Open store filtering
idx_stores_average_rating       → Rating sorting
idx_stores_is_active            → Active filtering
idx_stores_created_at           → Date sorting
```

## Common Queries

### Top 10 Stores by Revenue
```sql
SELECT name, total_revenue, total_orders, average_order_value
FROM stores
ORDER BY total_revenue DESC
LIMIT 10;
```

### Stores with High Customer Satisfaction
```sql
SELECT name, customer_satisfaction_score, averageRating
FROM stores
WHERE customer_satisfaction_score >= 4.5
ORDER BY customer_satisfaction_score DESC;
```

### Profitability Analysis
```sql
SELECT name, total_revenue, cost_of_goods_sold, net_profit, net_profit_margin
FROM stores
ORDER BY net_profit DESC;
```

### Stores with Inventory Issues
```sql
SELECT name, low_stock_items_count, out_of_stock_items_count
FROM stores
WHERE low_stock_items_count > 0 OR out_of_stock_items_count > 0;
```

### Currently Open Stores
```sql
SELECT name, is_open_now, last_opened_at, last_closed_at
FROM stores
WHERE is_open_now = true;
```

### Menu Items at a Store
```sql
SELECT mi.id, mi.name, mi.price
FROM menu_items mi
JOIN store_menu_items smi ON mi.id = smi.menu_item_id
WHERE smi.store_id = 'store-uuid';
```

## Default Values

All new columns have sensible defaults:
- Counts: `0`
- Money: `0.00`
- Percentages: `0.00` (except accuracy: `100.00`)
- Booleans: `true` (except is_open_now: `true`)
- Timestamps: `NULL`
- Text: `NULL`
- JSONB: `{}`

## Migration Status

✅ Migration file created: `1729284000000-EnhanceStoresTableWithAnalytics.ts`
✅ Entity updated: `store.entity.ts`
✅ Documentation created
⏳ Ready to run: `npm run migration:run`

