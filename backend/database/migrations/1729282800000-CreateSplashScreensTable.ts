import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSplashScreensTable1729282800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "splash_screens" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" varchar(255) NOT NULL,
        "description" text,
        "image_url" varchar(500) NOT NULL,
        "image_size_bytes" int,
        "display_duration" int NOT NULL DEFAULT 3,
        "start_date" timestamptz NOT NULL,
        "end_date" timestamptz NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        
        -- Reporting and Analytics
        "impressions" int NOT NULL DEFAULT 0,
        "clicks" int NOT NULL DEFAULT 0,
        "skips" int NOT NULL DEFAULT 0,
        "ctr" decimal(5, 2) NOT NULL DEFAULT 0,
        "skip_rate" decimal(5, 2) NOT NULL DEFAULT 0,
        
        -- Sales and Conversion Tracking
        "associated_orders" int NOT NULL DEFAULT 0,
        "associated_revenue" decimal(12, 2) NOT NULL DEFAULT 0,
        "conversion_rate" decimal(5, 2) NOT NULL DEFAULT 0,
        "average_order_value" decimal(10, 2) NOT NULL DEFAULT 0,
        
        -- Engagement Metrics
        "unique_users_shown" int NOT NULL DEFAULT 0,
        "unique_users_clicked" int NOT NULL DEFAULT 0,
        "average_view_time" decimal(8, 2) NOT NULL DEFAULT 0,
        
        -- Performance Tracking
        "last_impression_at" timestamptz,
        "last_click_at" timestamptz,
        
        -- Metadata
        "target_menu_item_id" uuid,
        "target_url" varchar(500),
        "notes" text,
        
        -- Timestamps
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX "idx_splash_screens_is_active" ON "splash_screens" ("is_active")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_splash_screens_date_range" ON "splash_screens" ("start_date", "end_date")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_splash_screens_created_at" ON "splash_screens" ("created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_splash_screens_impressions" ON "splash_screens" ("impressions")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_splash_screens_revenue" ON "splash_screens" ("associated_revenue")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "splash_screens"`);
  }
}

