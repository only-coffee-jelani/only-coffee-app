#!/usr/bin/env ts-node
/**
 * Script to update menu items:
 * 1. Change "Kleiner Schwarzer / Espresso" to "Small Black / Espresso"
 * 2. Delete: Kleiner Brauner, Cortado, Macchiato, Wiener Melange
 * 3. Add: Vienna Melange / Cappuccino
 * 
 * Usage: npx ts-node backend/database/scripts/update-menu-items.ts
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../services/gateway/.env') });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'only_coffee',
  synchronize: false,
  logging: false,
});

async function updateMenuItems() {
  try {
    console.log('🔄 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Connected to database\n');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Update "Kleiner Schwarzer / Espresso" to "Small Black / Espresso"
      console.log('📝 Step 1: Updating "Kleiner Schwarzer / Espresso" to "Small Black / Espresso"...');
      const updateResult = await queryRunner.query(
        `UPDATE menu_items 
         SET name = $1, updated_at = NOW() 
         WHERE name = $2`,
        ['Small Black / Espresso', 'Kleiner Schwarzer / Espresso']
      );
      console.log(`   ✅ Updated ${updateResult[1]} item(s)\n`);

      // 2. Delete items
      console.log('🗑️  Step 2: Deleting items...');
      const itemsToDelete = [
        'Kleiner Brauner',
        'Cortado',
        'Macchiato',
        'Wiener Melange'
      ];

      for (const itemName of itemsToDelete) {
        const deleteResult = await queryRunner.query(
          `DELETE FROM menu_items WHERE name = $1`,
          [itemName]
        );
        console.log(`   ✅ Deleted "${itemName}" - ${deleteResult[1]} item(s)`);
      }
      console.log('');

      // 3. Check if "Vienna Melange / Cappuccino" already exists
      console.log('➕ Step 3: Adding "Vienna Melange / Cappuccino"...');
      const existingItem = await queryRunner.query(
        `SELECT menu_item_id FROM menu_items WHERE name = $1`,
        ['Vienna Melange / Cappuccino']
      );

      if (existingItem.length > 0) {
        console.log('   ⚠️  "Vienna Melange / Cappuccino" already exists, skipping...\n');
      } else {
        // Get the Vienna Classics category ID
        const categoryResult = await queryRunner.query(
          `SELECT category_id FROM menu_categories WHERE name = $1`,
          ['Vienna Classics']
        );

        if (categoryResult.length === 0) {
          throw new Error('Vienna Classics category not found');
        }

        const categoryId = categoryResult[0].category_id;

        // Get all active stores
        const stores = await queryRunner.query(
          `SELECT store_id FROM stores WHERE is_active = true`
        );

        // Insert the new menu item
        const insertResult = await queryRunner.query(
          `INSERT INTO menu_items (
            category_id, name, description, base_price, calories,
            is_active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
          RETURNING menu_item_id`,
          [
            categoryId,
            'Vienna Melange / Cappuccino',
            'Traditional Viennese coffee with steamed milk and milk foam, cappuccino style',
            4.50,
            120
          ]
        );

        const newMenuItemId = insertResult[0].menu_item_id;
        console.log(`   ✅ Created "Vienna Melange / Cappuccino" (ID: ${newMenuItemId})`);

        // Associate with all stores
        for (const store of stores) {
          await queryRunner.query(
            `INSERT INTO menu_items (
              category_id, name, description, base_price, calories,
              is_active, created_at, updated_at, "storeIds"
            ) VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW(), ARRAY[$6]::uuid[])
            ON CONFLICT DO NOTHING`,
            [
              categoryId,
              'Vienna Melange / Cappuccino',
              'Traditional Viennese coffee with steamed milk and milk foam, cappuccino style',
              4.50,
              120,
              store.store_id
            ]
          );
        }
        console.log(`   ✅ Associated with ${stores.length} store(s)\n`);
      }

      await queryRunner.commitTransaction();
      console.log('✅ All changes committed successfully!\n');

      // Display summary
      console.log('📊 Summary of changes:');
      console.log('   ✅ Renamed: "Kleiner Schwarzer / Espresso" → "Small Black / Espresso"');
      console.log('   ✅ Deleted: Kleiner Brauner, Cortado, Macchiato, Wiener Melange');
      console.log('   ✅ Added: Vienna Melange / Cappuccino ($4.50)');

    } catch (error) {
      await queryRunner.rollback();
      throw error;
    } finally {
      await queryRunner.release();
    }

  } catch (error) {
    console.error('❌ Error updating menu items:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log('\n✅ Database connection closed');
  }
}

updateMenuItems();

