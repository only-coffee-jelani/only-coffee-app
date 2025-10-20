import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceStoresTableWithAnalytics1729284000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============ SALES & REVENUE TRACKING ============
    await queryRunner.query(`
      ALTER TABLE "stores"
      ADD COLUMN "total_orders" int NOT NULL DEFAULT 0,
      ADD COLUMN "total_revenue" decimal(12,2) NOT NULL DEFAULT 0,
      ADD COLUMN "total_revenue_today" decimal(12,2) NOT NULL DEFAULT 0,
      ADD COLUMN "total_revenue_this_week" decimal(12,2) NOT NULL DEFAULT 0,
      ADD COLUMN "total_revenue_this_month" decimal(12,2) NOT NULL DEFAULT 0,
      ADD COLUMN "average_order_value" decimal(10,2) NOT NULL DEFAULT 0,
      ADD COLUMN "highest_order_value" decimal(10,2) NOT NULL DEFAULT 0
    `);

    // ============ ORDER ANALYTICS ============
    await queryRunner.query(`
      ALTER TABLE "stores"
      ADD COLUMN "orders_today" int NOT NULL DEFAULT 0,
      ADD COLUMN "orders_this_week" int NOT NULL DEFAULT 0,
      ADD COLUMN "orders_this_month" int NOT NULL DEFAULT 0,
      ADD COLUMN "completed_orders" int NOT NULL DEFAULT 0,
      ADD COLUMN "cancelled_orders" int NOT NULL DEFAULT 0,
      ADD COLUMN "average_preparation_time" int NOT NULL DEFAULT 0,
      ADD COLUMN "average_wait_time" int NOT NULL DEFAULT 0
    `);

    // ============ CUSTOMER ANALYTICS ============
    await queryRunner.query(`
      ALTER TABLE "stores"
      ADD COLUMN "unique_customers" int NOT NULL DEFAULT 0,
      ADD COLUMN "repeat_customers" int NOT NULL DEFAULT 0,
      ADD COLUMN "new_customers_today" int NOT NULL DEFAULT 0,
      ADD COLUMN "new_customers_this_month" int NOT NULL DEFAULT 0,
      ADD COLUMN "customer_retention_rate" decimal(5,2) NOT NULL DEFAULT 0
    `);

    // ============ PRODUCT PERFORMANCE ============
    await queryRunner.query(`
      ALTER TABLE "stores"
      ADD COLUMN "top_selling_item_id" uuid,
      ADD COLUMN "top_selling_item_name" varchar(255),
      ADD COLUMN "top_selling_item_count" int NOT NULL DEFAULT 0,
      ADD COLUMN "items_sold_today" int NOT NULL DEFAULT 0,
      ADD COLUMN "items_sold_this_month" int NOT NULL DEFAULT 0
    `);

    // ============ PERFORMANCE METRICS ============
    await queryRunner.query(`
      ALTER TABLE "stores"
      ADD COLUMN "order_accuracy_rate" decimal(5,2) NOT NULL DEFAULT 100,
      ADD COLUMN "customer_satisfaction_score" decimal(3,2) NOT NULL DEFAULT 0,
      ADD COLUMN "on_time_delivery_rate" decimal(5,2) NOT NULL DEFAULT 0,
      ADD COLUMN "peak_hours" jsonb NOT NULL DEFAULT '{}'
    `);

    // ============ INVENTORY & STOCK ============
    await queryRunner.query(`
      ALTER TABLE "stores"
      ADD COLUMN "low_stock_items_count" int NOT NULL DEFAULT 0,
      ADD COLUMN "out_of_stock_items_count" int NOT NULL DEFAULT 0,
      ADD COLUMN "last_inventory_check" timestamptz
    `);

    // ============ OPERATIONAL METRICS ============
    await queryRunner.query(`
      ALTER TABLE "stores"
      ADD COLUMN "staff_count" int NOT NULL DEFAULT 0,
      ADD COLUMN "is_open_now" boolean NOT NULL DEFAULT true,
      ADD COLUMN "last_opened_at" timestamptz,
      ADD COLUMN "last_closed_at" timestamptz,
      ADD COLUMN "total_downtime_minutes" int NOT NULL DEFAULT 0,
      ADD COLUMN "operational_efficiency_score" decimal(5,2) NOT NULL DEFAULT 0
    `);

    // ============ MARKETING & PROMOTIONS ============
    await queryRunner.query(`
      ALTER TABLE "stores"
      ADD COLUMN "active_promotions_count" int NOT NULL DEFAULT 0,
      ADD COLUMN "total_promotions_used" int NOT NULL DEFAULT 0,
      ADD COLUMN "promotion_revenue" decimal(12,2) NOT NULL DEFAULT 0,
      ADD COLUMN "loyalty_program_members" int NOT NULL DEFAULT 0,
      ADD COLUMN "loyalty_points_redeemed" int NOT NULL DEFAULT 0
    `);

    // ============ DELIVERY & LOGISTICS ============
    await queryRunner.query(`
      ALTER TABLE "stores"
      ADD COLUMN "delivery_orders_count" int NOT NULL DEFAULT 0,
      ADD COLUMN "pickup_orders_count" int NOT NULL DEFAULT 0,
      ADD COLUMN "dine_in_orders_count" int NOT NULL DEFAULT 0,
      ADD COLUMN "average_delivery_time" int NOT NULL DEFAULT 0,
      ADD COLUMN "delivery_success_rate" decimal(5,2) NOT NULL DEFAULT 0
    `);

    // ============ FINANCIAL METRICS ============
    await queryRunner.query(`
      ALTER TABLE "stores"
      ADD COLUMN "cost_of_goods_sold" decimal(12,2) NOT NULL DEFAULT 0,
      ADD COLUMN "gross_profit" decimal(12,2) NOT NULL DEFAULT 0,
      ADD COLUMN "gross_profit_margin" decimal(5,2) NOT NULL DEFAULT 0,
      ADD COLUMN "operating_expenses" decimal(12,2) NOT NULL DEFAULT 0,
      ADD COLUMN "net_profit" decimal(12,2) NOT NULL DEFAULT 0,
      ADD COLUMN "net_profit_margin" decimal(5,2) NOT NULL DEFAULT 0
    `);

    // ============ TIMESTAMPS & TRACKING ============
    await queryRunner.query(`
      ALTER TABLE "stores"
      ADD COLUMN "last_analytics_update" timestamptz,
      ADD COLUMN "last_sales_report" timestamptz
    `);

    // ============ METADATA ============
    await queryRunner.query(`
      ALTER TABLE "stores"
      ADD COLUMN "store_image_url" varchar(500),
      ADD COLUMN "description" text,
      ADD COLUMN "notes" text,
      ADD COLUMN "manager_name" varchar(255),
      ADD COLUMN "manager_phone" varchar(20),
      ADD COLUMN "manager_email" varchar(255)
    `);

    // ============ CREATE INDEXES FOR PERFORMANCE ============
    await queryRunner.query(`
      CREATE INDEX "idx_stores_total_revenue" ON "stores" ("total_revenue" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_stores_total_orders" ON "stores" ("total_orders" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_stores_is_open_now" ON "stores" ("is_open_now")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_stores_average_rating" ON "stores" ("averageRating" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_stores_is_active" ON "stores" ("isActive")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_stores_created_at" ON "stores" ("createdAt" DESC)
    `);

    // ============ CREATE STORE_MENU_ITEMS JUNCTION TABLE ============
    await queryRunner.query(`
      CREATE TABLE "store_menu_items" (
        "store_id" uuid NOT NULL,
        "menu_item_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("store_id", "menu_item_id"),
        FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE,
        FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_store_menu_items_store_id" ON "store_menu_items" ("store_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_store_menu_items_menu_item_id" ON "store_menu_items" ("menu_item_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop junction table first
    await queryRunner.query(`DROP TABLE IF EXISTS "store_menu_items" CASCADE`);

    // Drop all indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_stores_total_revenue"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_stores_total_orders"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_stores_is_open_now"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_stores_average_rating"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_stores_is_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_stores_created_at"`);

    // Drop all added columns
    await queryRunner.query(`
      ALTER TABLE "stores"
      DROP COLUMN IF EXISTS "total_orders",
      DROP COLUMN IF EXISTS "total_revenue",
      DROP COLUMN IF EXISTS "total_revenue_today",
      DROP COLUMN IF EXISTS "total_revenue_this_week",
      DROP COLUMN IF EXISTS "total_revenue_this_month",
      DROP COLUMN IF EXISTS "average_order_value",
      DROP COLUMN IF EXISTS "highest_order_value",
      DROP COLUMN IF EXISTS "orders_today",
      DROP COLUMN IF EXISTS "orders_this_week",
      DROP COLUMN IF EXISTS "orders_this_month",
      DROP COLUMN IF EXISTS "completed_orders",
      DROP COLUMN IF EXISTS "cancelled_orders",
      DROP COLUMN IF EXISTS "average_preparation_time",
      DROP COLUMN IF EXISTS "average_wait_time",
      DROP COLUMN IF EXISTS "unique_customers",
      DROP COLUMN IF EXISTS "repeat_customers",
      DROP COLUMN IF EXISTS "new_customers_today",
      DROP COLUMN IF EXISTS "new_customers_this_month",
      DROP COLUMN IF EXISTS "customer_retention_rate",
      DROP COLUMN IF EXISTS "top_selling_item_id",
      DROP COLUMN IF EXISTS "top_selling_item_name",
      DROP COLUMN IF EXISTS "top_selling_item_count",
      DROP COLUMN IF EXISTS "items_sold_today",
      DROP COLUMN IF EXISTS "items_sold_this_month",
      DROP COLUMN IF EXISTS "order_accuracy_rate",
      DROP COLUMN IF EXISTS "customer_satisfaction_score",
      DROP COLUMN IF EXISTS "on_time_delivery_rate",
      DROP COLUMN IF EXISTS "peak_hours",
      DROP COLUMN IF EXISTS "low_stock_items_count",
      DROP COLUMN IF EXISTS "out_of_stock_items_count",
      DROP COLUMN IF EXISTS "last_inventory_check",
      DROP COLUMN IF EXISTS "staff_count",
      DROP COLUMN IF EXISTS "is_open_now",
      DROP COLUMN IF EXISTS "last_opened_at",
      DROP COLUMN IF EXISTS "last_closed_at",
      DROP COLUMN IF EXISTS "total_downtime_minutes",
      DROP COLUMN IF EXISTS "operational_efficiency_score",
      DROP COLUMN IF EXISTS "active_promotions_count",
      DROP COLUMN IF EXISTS "total_promotions_used",
      DROP COLUMN IF EXISTS "promotion_revenue",
      DROP COLUMN IF EXISTS "loyalty_program_members",
      DROP COLUMN IF EXISTS "loyalty_points_redeemed",
      DROP COLUMN IF EXISTS "delivery_orders_count",
      DROP COLUMN IF EXISTS "pickup_orders_count",
      DROP COLUMN IF EXISTS "dine_in_orders_count",
      DROP COLUMN IF EXISTS "average_delivery_time",
      DROP COLUMN IF EXISTS "delivery_success_rate",
      DROP COLUMN IF EXISTS "cost_of_goods_sold",
      DROP COLUMN IF EXISTS "gross_profit",
      DROP COLUMN IF EXISTS "gross_profit_margin",
      DROP COLUMN IF EXISTS "operating_expenses",
      DROP COLUMN IF EXISTS "net_profit",
      DROP COLUMN IF EXISTS "net_profit_margin",
      DROP COLUMN IF EXISTS "last_analytics_update",
      DROP COLUMN IF EXISTS "last_sales_report",
      DROP COLUMN IF EXISTS "store_image_url",
      DROP COLUMN IF EXISTS "description",
      DROP COLUMN IF EXISTS "notes",
      DROP COLUMN IF EXISTS "manager_name",
      DROP COLUMN IF EXISTS "manager_phone",
      DROP COLUMN IF EXISTS "manager_email"
    `);
  }
}

