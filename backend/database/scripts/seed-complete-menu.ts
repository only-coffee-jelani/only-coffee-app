#!/usr/bin/env ts-node
/**
 * Enterprise-Level Complete Menu Seeding Script
 * 
 * Purpose: Seeds the complete Only Coffee menu with all categories and items
 * Assigns all items to all active stores using the store_menu_items junction table
 * 
 * Features:
 * - ✅ Transaction safety with automatic rollback on error
 * - ✅ Idempotent (can be run multiple times safely)
 * - ✅ Multi-store support via junction table
 * - ✅ Comprehensive error handling and logging
 * - ✅ Data validation and verification
 * - ✅ Production-ready with proper constraints
 * 
 * Usage: npx ts-node backend/database/scripts/seed-complete-menu.ts
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../services/gateway/.env') });

interface MenuCategory {
  name: string;
  description: string;
  sortOrder: number;
}

interface MenuItem {
  name: string;
  description: string;
  basePrice: number;
  categoryName: string;
  calories?: number;
}

// ============================================
// MENU CATEGORIES
// ============================================
const categories: MenuCategory[] = [
  {
    name: 'Vienna Classics',
    description: 'Traditional Viennese coffee specialties crafted with precision',
    sortOrder: 1,
  },
  {
    name: 'Ethiopia / Specialty Coffees',
    description: 'Premium Ethiopian single-origin coffee and specialty brews',
    sortOrder: 2,
  },
  {
    name: 'Coffee Cocktails',
    description: 'Creative coffee-based beverages with unique flavor combinations',
    sortOrder: 3,
  },
  {
    name: 'Summer Drinks',
    description: 'Refreshing cold coffee beverages perfect for warm weather',
    sortOrder: 4,
  },
  {
    name: 'Soft-Ice / Ice Cream',
    description: 'Premium soft-serve ice cream and frozen treats',
    sortOrder: 5,
  },
  {
    name: 'Hot Chocolate',
    description: 'Rich and creamy hot chocolate made with premium cocoa',
    sortOrder: 6,
  },
  {
    name: 'Add-Ons',
    description: 'Customize your drink with premium add-ons and alternatives',
    sortOrder: 7,
  },
];

// ============================================
// MENU ITEMS
// ============================================
const menuItems: MenuItem[] = [
  // Vienna Classics
  {
    name: 'Kleiner Schwarzer / Espresso',
    description: 'Classic single shot espresso - the foundation of Viennese coffee culture',
    basePrice: 2.50,
    categoryName: 'Vienna Classics',
    calories: 5,
  },
  {
    name: 'Piccolo',
    description: 'Small espresso with a touch of steamed milk for a smooth finish',
    basePrice: 3.50,
    categoryName: 'Vienna Classics',
    calories: 30,
  },
  {
    name: 'Kleiner Brauner',
    description: 'Espresso with a small amount of milk or cream, served Viennese style',
    basePrice: 3.50,
    categoryName: 'Vienna Classics',
    calories: 35,
  },
  {
    name: 'Cortado',
    description: 'Espresso cut with equal parts steamed milk for perfect balance',
    basePrice: 3.50,
    categoryName: 'Vienna Classics',
    calories: 40,
  },
  {
    name: 'Macchiato',
    description: 'Espresso marked with a dollop of foamed milk',
    basePrice: 3.50,
    categoryName: 'Vienna Classics',
    calories: 20,
  },
  {
    name: 'Wiener Melange',
    description: 'Traditional Viennese coffee with steamed milk and milk foam',
    basePrice: 4.50,
    categoryName: 'Vienna Classics',
    calories: 120,
  },
  {
    name: 'Cappuccino',
    description: 'Classic Italian-style cappuccino with rich espresso and velvety foam',
    basePrice: 4.50,
    categoryName: 'Vienna Classics',
    calories: 120,
  },
  {
    name: 'Flat White',
    description: 'Smooth espresso with velvety microfoam milk',
    basePrice: 5.50,
    categoryName: 'Vienna Classics',
    calories: 130,
  },
  {
    name: 'Einspänner',
    description: 'Viennese specialty: espresso topped with whipped cream',
    basePrice: 6.00,
    categoryName: 'Vienna Classics',
    calories: 150,
  },
  {
    name: 'Latte',
    description: 'Espresso with steamed milk and a light layer of foam',
    basePrice: 5.00,
    categoryName: 'Vienna Classics',
    calories: 150,
  },
  {
    name: 'Thomas Kaffee Latte',
    description: 'Our signature latte with a special blend and preparation method',
    basePrice: 6.00,
    categoryName: 'Vienna Classics',
    calories: 160,
  },

  // Ethiopia / Specialty Coffees
  {
    name: 'Ethiopia Doppio',
    description: 'Double shot of premium Ethiopian single-origin espresso',
    basePrice: 5.50,
    categoryName: 'Ethiopia / Specialty Coffees',
    calories: 10,
  },
  {
    name: 'Ethiopia Flat White',
    description: 'Premium Ethiopian espresso with velvety microfoam milk',
    basePrice: 6.50,
    categoryName: 'Ethiopia / Specialty Coffees',
    calories: 140,
  },
  {
    name: 'Brewed Coffee (Small)',
    description: 'Freshly brewed filter coffee - small size',
    basePrice: 4.00,
    categoryName: 'Ethiopia / Specialty Coffees',
    calories: 5,
  },
  {
    name: 'Brewed Coffee (Large)',
    description: 'Freshly brewed filter coffee - large size',
    basePrice: 5.00,
    categoryName: 'Ethiopia / Specialty Coffees',
    calories: 10,
  },
  {
    name: 'King Kong Coldbrew',
    description: 'Bold and smooth cold brew coffee steeped for 24 hours',
    basePrice: 5.50,
    categoryName: 'Ethiopia / Specialty Coffees',
    calories: 5,
  },

  // Coffee Cocktails
  {
    name: 'Salted Caramel Espresso Macchiato',
    description: 'Espresso macchiato with house-made salted caramel',
    basePrice: 6.00,
    categoryName: 'Coffee Cocktails',
    calories: 180,
  },
  {
    name: 'Cappuccino Marshmallow Fluff',
    description: 'Cappuccino topped with fluffy marshmallow cream',
    basePrice: 6.00,
    categoryName: 'Coffee Cocktails',
    calories: 200,
  },
  {
    name: 'Honey Latte Macchiato',
    description: 'Layered latte macchiato sweetened with natural honey',
    basePrice: 6.00,
    categoryName: 'Coffee Cocktails',
    calories: 190,
  },
  {
    name: 'Orangeccino',
    description: 'Unique cappuccino infused with fresh orange essence',
    basePrice: 7.00,
    categoryName: 'Coffee Cocktails',
    calories: 140,
  },
  {
    name: 'Kaffee Latte with Oreo',
    description: 'Creamy latte blended with crushed Oreo cookies',
    basePrice: 7.00,
    categoryName: 'Coffee Cocktails',
    calories: 280,
  },
  {
    name: 'Waffolino',
    description: 'Signature drink served in a waffle cone with espresso and cream',
    basePrice: 9.50,
    categoryName: 'Coffee Cocktails',
    calories: 350,
  },
  {
    name: 'Waffolino con Pistacchio',
    description: 'Premium Waffolino with pistachio cream and toppings',
    basePrice: 12.50,
    categoryName: 'Coffee Cocktails',
    calories: 420,
  },

  // Summer Drinks
  {
    name: 'Espresso-Tonic',
    description: 'Refreshing combination of espresso and premium tonic water over ice',
    basePrice: 8.50,
    categoryName: 'Summer Drinks',
    calories: 80,
  },
  {
    name: 'Affogato',
    description: 'Classic Italian dessert: vanilla ice cream drowned in hot espresso',
    basePrice: 6.50,
    categoryName: 'Summer Drinks',
    calories: 220,
  },
  {
    name: 'Waffolino Affogato',
    description: 'Waffolino meets affogato - the ultimate indulgence',
    basePrice: 11.50,
    categoryName: 'Summer Drinks',
    calories: 450,
  },

  // Soft-Ice / Ice Cream
  {
    name: 'Soft-Ice Vanilla',
    description: 'Premium vanilla soft-serve ice cream',
    basePrice: 5.00,
    categoryName: 'Soft-Ice / Ice Cream',
    calories: 200,
  },

  // Hot Chocolate
  {
    name: 'Hot Chocolate (Small)',
    description: 'Rich and creamy hot chocolate made with premium cocoa - small size',
    basePrice: 4.00,
    categoryName: 'Hot Chocolate',
    calories: 250,
  },
  {
    name: 'Hot Chocolate (Large)',
    description: 'Rich and creamy hot chocolate made with premium cocoa - large size',
    basePrice: 5.00,
    categoryName: 'Hot Chocolate',
    calories: 350,
  },

  // Add-Ons
  {
    name: 'Extra Espresso Shot',
    description: 'Add an extra shot of espresso to any drink',
    basePrice: 1.50,
    categoryName: 'Add-Ons',
    calories: 5,
  },
  {
    name: 'Oat Milk',
    description: 'Substitute with creamy oat milk',
    basePrice: 0.50,
    categoryName: 'Add-Ons',
    calories: 0,
  },
  {
    name: 'Soy Milk',
    description: 'Substitute with soy milk',
    basePrice: 0.50,
    categoryName: 'Add-Ons',
    calories: 0,
  },
  {
    name: 'Coconut Milk',
    description: 'Substitute with coconut milk',
    basePrice: 0.50,
    categoryName: 'Add-Ons',
    calories: 0,
  },
  {
    name: 'Lactose-Free Milk',
    description: 'Substitute with lactose-free milk',
    basePrice: 0.50,
    categoryName: 'Add-Ons',
    calories: 0,
  },
];

// ============================================
// DATABASE CONNECTION
// ============================================
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

// ============================================
// MAIN SEEDING FUNCTION
// ============================================
async function seedCompleteMenu() {
  let connection: DataSource | null = null;

  try {
    console.log('🚀 Starting Complete Menu Seeding Process...\n');
    console.log('=' .repeat(60));
    console.log('📊 Menu Statistics:');
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Menu Items: ${menuItems.length}`);
    console.log('=' .repeat(60));
    console.log('');

    // Initialize database connection
    console.log('🔌 Connecting to database...');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Database: ${process.env.DB_DATABASE}`);

    connection = await dataSource.initialize();
    console.log('✅ Database connection established\n');

    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();

    // Start transaction
    console.log('🔄 Starting database transaction...');
    await queryRunner.startTransaction();

    try {
      // Step 1: Verify active stores exist
      console.log('📍 Step 1: Verifying active stores...');
      const stores = await queryRunner.query(`
        SELECT store_id, name, is_active
        FROM stores
        WHERE is_active = true
        ORDER BY name
      `);

      if (stores.length === 0) {
        throw new Error('❌ No active stores found. Please create stores first.');
      }

      console.log(`✅ Found ${stores.length} active store(s):`);
      stores.forEach((store: any, index: number) => {
        console.log(`   ${index + 1}. ${store.name} (${store.store_id})`);
      });
      console.log('');

      // Step 2: Check if store_menu_items junction table exists
      console.log('🔍 Step 2: Checking database schema...');
      const tableCheck = await queryRunner.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'store_menu_items'
        ) as has_junction_table
      `);

      const useJunctionTable = tableCheck[0].has_junction_table;
      console.log(`   Schema type: ${useJunctionTable ? '✅ Enterprise (with junction table)' : '⚠️  Legacy (without junction table)'}`);

      if (!useJunctionTable) {
        throw new Error('❌ store_menu_items junction table not found. Please run migration first.');
      }
      console.log('');

      // Step 3: Clear existing menu data
      console.log('🗑️  Step 3: Clearing existing menu data...');
      const deleteStoreMenuItems = await queryRunner.query(`DELETE FROM store_menu_items`);
      const deleteMenuItems = await queryRunner.query(`DELETE FROM menu_items`);
      const deleteCategories = await queryRunner.query(`DELETE FROM menu_categories`);
      console.log(`   ✅ Cleared ${deleteStoreMenuItems[1] || 0} store-menu associations`);
      console.log(`   ✅ Cleared ${deleteMenuItems[1] || 0} menu items`);
      console.log(`   ✅ Cleared ${deleteCategories[1] || 0} categories`);
      console.log('');

      // Step 4: Insert categories
      console.log('📂 Step 4: Creating menu categories...');
      const categoryMap = new Map<string, string>();

      for (const category of categories) {
        const result = await queryRunner.query(
          `INSERT INTO menu_categories (name, description, sort_order, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())
           RETURNING category_id`,
          [category.name, category.description, category.sortOrder]
        );
        categoryMap.set(category.name, result[0].category_id);
        console.log(`   ✅ ${category.sortOrder}. ${category.name}`);
      }
      console.log(`✅ Created ${categories.length} categories\n`);

      // Step 5: Insert menu items
      console.log('☕ Step 5: Creating menu items...');
      const menuItemIds: string[] = [];
      let itemCount = 0;

      for (const item of menuItems) {
        const categoryId = categoryMap.get(item.categoryName);
        if (!categoryId) {
          throw new Error(`❌ Category not found: ${item.categoryName}`);
        }

        const result = await queryRunner.query(
          `INSERT INTO menu_items (
            category_id, name, description, base_price, calories,
            is_active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
          RETURNING menu_item_id`,
          [categoryId, item.name, item.description, item.basePrice, item.calories || null]
        );

        menuItemIds.push(result[0].menu_item_id);
        itemCount++;
        console.log(`   ✅ [${itemCount}/${menuItems.length}] ${item.name} - $${item.basePrice.toFixed(2)}`);
      }
      console.log(`✅ Created ${menuItemIds.length} menu items\n`);

      // Step 6: Associate all menu items with all active stores
      console.log('🔗 Step 6: Associating menu items with stores...');
      let associationCount = 0;

      for (const store of stores) {
        console.log(`   📍 ${store.name}:`);
        for (const menuItemId of menuItemIds) {
          await queryRunner.query(
            `INSERT INTO store_menu_items (store_id, menu_item_id, is_available, created_at, updated_at)
             VALUES ($1, $2, true, NOW(), NOW())`,
            [store.store_id, menuItemId]
          );
          associationCount++;
        }
        console.log(`      ✅ Associated ${menuItemIds.length} items`);
      }
      console.log(`✅ Created ${associationCount} store-menu associations\n`);

      // Step 7: Verify data integrity
      console.log('🔍 Step 7: Verifying data integrity...');

      const categoryCount = await queryRunner.query(`SELECT COUNT(*) as count FROM menu_categories`);
      const itemCount = await queryRunner.query(`SELECT COUNT(*) as count FROM menu_items`);
      const associationCountResult = await queryRunner.query(`SELECT COUNT(*) as count FROM store_menu_items`);

      console.log(`   ✅ Categories in database: ${categoryCount[0].count}`);
      console.log(`   ✅ Menu items in database: ${itemCount[0].count}`);
      console.log(`   ✅ Store-menu associations: ${associationCountResult[0].count}`);

      // Validate counts
      if (parseInt(categoryCount[0].count) !== categories.length) {
        throw new Error(`❌ Category count mismatch! Expected ${categories.length}, got ${categoryCount[0].count}`);
      }
      if (parseInt(itemCount[0].count) !== menuItems.length) {
        throw new Error(`❌ Menu item count mismatch! Expected ${menuItems.length}, got ${itemCount[0].count}`);
      }
      if (parseInt(associationCountResult[0].count) !== associationCount) {
        throw new Error(`❌ Association count mismatch! Expected ${associationCount}, got ${associationCountResult[0].count}`);
      }
      console.log('✅ Data integrity verified\n');

      // Commit transaction
      console.log('💾 Committing transaction...');
      await queryRunner.commitTransaction();
      console.log('✅ Transaction committed successfully\n');

      // Success summary
      console.log('=' .repeat(60));
      console.log('🎉 MENU SEEDING COMPLETED SUCCESSFULLY!');
      console.log('=' .repeat(60));
      console.log('📊 Summary:');
      console.log(`   ✅ ${categories.length} categories created`);
      console.log(`   ✅ ${menuItems.length} menu items created`);
      console.log(`   ✅ ${stores.length} stores configured`);
      console.log(`   ✅ ${associationCount} store-menu associations created`);
      console.log('=' .repeat(60));
      console.log('');
      console.log('✨ All menu items are now available in all active stores!');
      console.log('');

    } catch (error) {
      // Rollback transaction on error
      console.error('\n❌ Error during seeding process:');
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
      console.log('✅ Database connection closed\n');
    }
  }
}

// ============================================
// EXECUTE SCRIPT
// ============================================
if (require.main === module) {
  seedCompleteMenu()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { seedCompleteMenu, categories, menuItems };

