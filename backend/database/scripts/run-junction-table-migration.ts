#!/usr/bin/env ts-node
/**
 * Run Store Menu Items Junction Table Migration
 * 
 * Purpose: Creates the store_menu_items junction table
 * This enables many-to-many relationships between stores and menu items
 * 
 * Usage: npx ts-node backend/database/scripts/run-junction-table-migration.ts
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../services/gateway/.env') });

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'only_coffee',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: false,
});

async function runMigration() {
  let connection: DataSource | null = null;

  try {
    console.log('🚀 Running Store Menu Items Junction Table Migration\n');
    console.log('=' .repeat(60));

    // Connect to database
    console.log('🔌 Connecting to database...');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Database: ${process.env.DB_DATABASE}`);
    connection = await dataSource.initialize();
    console.log('✅ Connected\n');

    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();

    // Check if table already exists
    console.log('🔍 Checking if store_menu_items table exists...');
    const tableExists = await queryRunner.hasTable('store_menu_items');
    
    if (tableExists) {
      console.log('⚠️  Table already exists! Skipping creation.\n');
      console.log('If you want to recreate the table, drop it first:');
      console.log('   DROP TABLE store_menu_items CASCADE;\n');
      await queryRunner.release();
      return;
    }

    console.log('✅ Table does not exist, proceeding with creation...\n');

    // Start transaction
    console.log('🔄 Starting transaction...');
    await queryRunner.startTransaction();

    try {
      // Create table
      console.log('📋 Creating store_menu_items table...');
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
      console.log('✅ Table created\n');

      // Create indexes
      console.log('📊 Creating indexes...');
      
      await queryRunner.query(`
        CREATE INDEX "idx_store_menu_items_store_id"
        ON "store_menu_items" ("store_id")
      `);
      console.log('   ✅ idx_store_menu_items_store_id');

      await queryRunner.query(`
        CREATE INDEX "idx_store_menu_items_menu_item_id"
        ON "store_menu_items" ("menu_item_id")
      `);
      console.log('   ✅ idx_store_menu_items_menu_item_id');

      await queryRunner.query(`
        CREATE INDEX "idx_store_menu_items_is_available"
        ON "store_menu_items" ("is_available")
      `);
      console.log('   ✅ idx_store_menu_items_is_available\n');

      // Commit transaction
      console.log('💾 Committing transaction...');
      await queryRunner.commitTransaction();
      console.log('✅ Transaction committed\n');

      // Verify table creation
      console.log('🔍 Verifying table creation...');
      const verifyTable = await queryRunner.hasTable('store_menu_items');
      if (verifyTable) {
        console.log('✅ Table verified successfully\n');
      } else {
        throw new Error('Table verification failed!');
      }

      console.log('=' .repeat(60));
      console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
      console.log('=' .repeat(60));
      console.log('\n✨ The store_menu_items junction table is now ready!');
      console.log('\nNext step: Run the menu seeding script:');
      console.log('   npx ts-node backend/database/scripts/seed-complete-menu.ts\n');

    } catch (error) {
      console.error('\n❌ Error during migration:');
      console.error(error);
      console.log('\n🔄 Rolling back transaction...');
      await queryRunner.rollbackTransaction();
      console.log('✅ Transaction rolled back\n');
      throw error;
    } finally {
      await queryRunner.release();
    }

  } catch (error) {
    console.error('\n💥 Fatal Error:');
    console.error(error);
    process.exit(1);
  } finally {
    if (connection && connection.isInitialized) {
      console.log('🔌 Closing database connection...');
      await connection.destroy();
      console.log('✅ Connection closed\n');
    }
  }
}

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { runMigration };

