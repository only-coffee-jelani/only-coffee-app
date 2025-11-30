import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create store_menu_items Junction Table
 * 
 * Purpose: Enable many-to-many relationship between stores and menu_items
 * This allows menu items to be shared across multiple stores without duplication
 * 
 * Enterprise Features:
 * - Composite primary key for data integrity
 * - Foreign key constraints with CASCADE delete
 * - Optimized indexes for query performance
 * - Timestamps for audit trail
 */
export class CreateStoreMenuItemsJunction1732900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if table already exists
    const tableExists = await queryRunner.hasTable('store_menu_items');
    
    if (!tableExists) {
      console.log('Creating store_menu_items junction table...');
      
      await queryRunner.query(`
        CREATE TABLE "store_menu_items" (
          "store_id" uuid NOT NULL,
          "menu_item_id" uuid NOT NULL,
          "is_available" boolean NOT NULL DEFAULT true,
          "created_at" timestamptz NOT NULL DEFAULT now(),
          "updated_at" timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY ("store_id", "menu_item_id"),
          CONSTRAINT "fk_store_menu_items_store"
            FOREIGN KEY ("store_id")
            REFERENCES "stores"("store_id")
            ON DELETE CASCADE,
          CONSTRAINT "fk_store_menu_items_menu_item"
            FOREIGN KEY ("menu_item_id")
            REFERENCES "menu_items"("menu_item_id")
            ON DELETE CASCADE
        )
      `);

      // Create indexes for optimized queries
      await queryRunner.query(`
        CREATE INDEX "idx_store_menu_items_store_id"
        ON "store_menu_items" ("store_id")
      `);

      await queryRunner.query(`
        CREATE INDEX "idx_store_menu_items_menu_item_id"
        ON "store_menu_items" ("menu_item_id")
      `);

      await queryRunner.query(`
        CREATE INDEX "idx_store_menu_items_is_available"
        ON "store_menu_items" ("is_available")
      `);

      console.log('✅ store_menu_items junction table created successfully');
    } else {
      console.log('⚠️  store_menu_items table already exists, skipping creation');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Dropping store_menu_items junction table...');
    
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_store_menu_items_is_available"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_store_menu_items_menu_item_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_store_menu_items_store_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "store_menu_items" CASCADE`);
    
    console.log('✅ store_menu_items junction table dropped successfully');
  }
}

