#!/usr/bin/env ts-node
/**
 * Enterprise-Level Menu Seeding Script
 * Seeds Vienna-style coffee menu with categories and items
 * Assigns all items to all active stores
 * 
 * Usage: npx ts-node backend/database/scripts/seed-vienna-menu.ts
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
}

// Define categories with proper ordering
const categories: MenuCategory[] = [
  {
    name: 'Vienna Classics',
    description: 'Traditional Viennese coffee specialties',
    sortOrder: 1,
  },
  {
    name: 'Ethiopia / Specialty Coffees',
    description: 'Premium Ethiopian coffee and specialty brews',
    sortOrder: 2,
  },
  {
    name: 'Coffee Cocktails',
    description: 'Creative coffee-based beverages',
    sortOrder: 3,
  },
  {
    name: 'Summer Drinks',
    description: 'Refreshing cold coffee beverages',
    sortOrder: 4,
  },
  {
    name: 'Soft-Ice / Ice Cream',
    description: 'Premium soft-serve ice cream',
    sortOrder: 5,
  },
  {
    name: 'Hot Chocolate',
    description: 'Rich and creamy hot chocolate',
    sortOrder: 6,
  },
  {
    name: 'Add-Ons',
    description: 'Customize your drink',
    sortOrder: 7,
  },
];

// Define menu items
const menuItems: MenuItem[] = [
  // Vienna Classics
  { name: 'Kleiner Schwarzer / Espresso', description: 'Classic single shot espresso', basePrice: 2.50, categoryName: 'Vienna Classics' },
  { name: 'Piccolo', description: 'Small espresso with a touch of steamed milk', basePrice: 3.50, categoryName: 'Vienna Classics' },
  { name: 'Kleiner Brauner', description: 'Espresso with a small amount of milk or cream', basePrice: 3.50, categoryName: 'Vienna Classics' },
  { name: 'Cortado', description: 'Espresso cut with equal parts steamed milk', basePrice: 3.50, categoryName: 'Vienna Classics' },
  { name: 'Macchiato', description: 'Espresso marked with a dollop of foamed milk', basePrice: 3.50, categoryName: 'Vienna Classics' },
  { name: 'Wiener Melange', description: 'Traditional Viennese coffee with foamed milk', basePrice: 4.50, categoryName: 'Vienna Classics' },
  { name: 'Cappuccino', description: 'Classic Italian espresso with steamed milk and foam', basePrice: 4.50, categoryName: 'Vienna Classics' },
  { name: 'Flat White', description: 'Smooth espresso with velvety microfoam milk', basePrice: 5.50, categoryName: 'Vienna Classics' },
  { name: 'Einspänner', description: 'Espresso topped with whipped cream', basePrice: 6.00, categoryName: 'Vienna Classics' },
  { name: 'Latte', description: 'Espresso with steamed milk and light foam', basePrice: 5.00, categoryName: 'Vienna Classics' },
  { name: 'Thomas Kaffee Latte', description: 'Our signature latte with special blend', basePrice: 6.00, categoryName: 'Vienna Classics' },

  // Ethiopia / Specialty Coffees
  { name: 'Ethiopia Doppio', description: 'Double shot of premium Ethiopian espresso', basePrice: 5.50, categoryName: 'Ethiopia / Specialty Coffees' },
  { name: 'Ethiopia Flat White', description: 'Ethiopian espresso with velvety microfoam', basePrice: 6.50, categoryName: 'Ethiopia / Specialty Coffees' },
  { name: 'Brewed Coffee (Small)', description: 'Freshly brewed filter coffee', basePrice: 4.00, categoryName: 'Ethiopia / Specialty Coffees' },
  { name: 'Brewed Coffee (Large)', description: 'Freshly brewed filter coffee, large size', basePrice: 5.00, categoryName: 'Ethiopia / Specialty Coffees' },
  { name: 'King Kong Coldbrew', description: 'Smooth cold brewed coffee, large size', basePrice: 5.50, categoryName: 'Ethiopia / Specialty Coffees' },

  // Coffee Cocktails
  { name: 'Salted Caramel Espresso Macchiato', description: 'Double espresso with milk and real salted caramel', basePrice: 6.00, categoryName: 'Coffee Cocktails' },
  { name: 'Cappuccino Marshmallow Fluff', description: 'Cappuccino topped with marshmallow fluff', basePrice: 6.00, categoryName: 'Coffee Cocktails' },
  { name: 'Honey Latte Macchiato', description: 'Layered latte with natural honey', basePrice: 6.00, categoryName: 'Coffee Cocktails' },
  { name: 'Orangeccino', description: 'Cappuccino with orange zest and flavor', basePrice: 7.00, categoryName: 'Coffee Cocktails' },
  { name: 'Kaffee Latte with Oreo', description: 'Latte blended with Oreo cookies', basePrice: 7.00, categoryName: 'Coffee Cocktails' },
  { name: 'Waffolino', description: 'Espresso and foamed milk served in a waffle cone', basePrice: 9.50, categoryName: 'Coffee Cocktails' },
  { name: 'Waffolino con Pistacchio', description: 'Waffolino with pistachio flavor and toppings', basePrice: 12.50, categoryName: 'Coffee Cocktails' },

  // Summer Drinks
  { name: 'Espresso-Tonic', description: 'Refreshing espresso with tonic water and ice', basePrice: 8.50, categoryName: 'Summer Drinks' },
  { name: 'Affogato', description: 'Vanilla ice cream drowned in hot espresso', basePrice: 6.50, categoryName: 'Summer Drinks' },
  { name: 'Waffolino Affogato', description: 'Waffolino with vanilla ice cream and espresso', basePrice: 11.50, categoryName: 'Summer Drinks' },

  // Soft-Ice / Ice Cream
  { name: 'Soft-Ice Vanilla', description: 'Premium vanilla soft-serve ice cream', basePrice: 5.00, categoryName: 'Soft-Ice / Ice Cream' },

  // Hot Chocolate
  { name: 'Hot Chocolate (Small)', description: 'Rich and creamy hot chocolate', basePrice: 4.00, categoryName: 'Hot Chocolate' },
  { name: 'Hot Chocolate (Large)', description: 'Rich and creamy hot chocolate, large size', basePrice: 5.00, categoryName: 'Hot Chocolate' },

  // Add-Ons
  { name: 'Extra Espresso Shot', description: 'Add an extra shot of espresso to any drink', basePrice: 1.50, categoryName: 'Add-Ons' },
  { name: 'Oat Milk', description: 'Substitute with oat milk', basePrice: 0.50, categoryName: 'Add-Ons' },
  { name: 'Soy Milk', description: 'Substitute with soy milk', basePrice: 0.50, categoryName: 'Add-Ons' },
  { name: 'Coconut Milk', description: 'Substitute with coconut milk', basePrice: 0.50, categoryName: 'Add-Ons' },
  { name: 'Lactose-Free Milk', description: 'Substitute with lactose-free milk', basePrice: 0.50, categoryName: 'Add-Ons' },
];

// Create database connection
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

async function seedMenu() {
  console.log('========================================');
  console.log('   VIENNA MENU SEEDING SCRIPT');
  console.log('========================================\n');

  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to database\n');

    // Start transaction
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Step 1: Get all active stores
      console.log('📍 Fetching active stores...');
      const stores = await queryRunner.query(`
        SELECT store_id, name FROM stores WHERE is_active = true
      `);

      if (stores.length === 0) {
        throw new Error('No active stores found. Please create stores first.');
      }

      console.log(`✅ Found ${stores.length} active stores:`);
      stores.forEach((store: any) => {
        console.log(`   - ${store.name} (${store.store_id})`);
      });
      console.log('');

      // Step 2: Detect schema type and clear existing menu data
      console.log('🔍 Detecting database schema...');
      const tableCheck = await queryRunner.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'store_menu_items'
        ) as has_junction_table
      `);

      const useJunctionTable = tableCheck[0].has_junction_table;
      console.log(`   Schema type: ${useJunctionTable ? 'Enterprise (with junction table)' : 'Legacy (with storeId column)'}\n`);

      console.log('🗑️  Clearing existing menu data...');
      if (useJunctionTable) {
        await queryRunner.query(`DELETE FROM store_menu_items`);
      }
      await queryRunner.query(`DELETE FROM menu_items`);
      await queryRunner.query(`DELETE FROM menu_categories`);
      console.log('✅ Cleared existing menu data\n');

      // Step 3: Insert categories
      console.log('📂 Creating menu categories...');
      const categoryMap = new Map<string, string>();

      for (const category of categories) {
        const result = await queryRunner.query(
          `INSERT INTO menu_categories (name, description, sort_order, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())
           RETURNING category_id`,
          [category.name, category.description, category.sortOrder]
        );
        categoryMap.set(category.name, result[0].category_id);
        console.log(`   ✅ ${category.name}`);
      }
      console.log(`✅ Created ${categoryMap.size} categories\n`);

      // Step 4: Insert menu items (schema-aware)
      console.log('🍰 Creating menu items...');
      let totalItemsCreated = 0;

      if (useJunctionTable) {
        // Enterprise schema: Create items once, then associate with stores
        const menuItemIds: string[] = [];

        for (const item of menuItems) {
          const categoryId = categoryMap.get(item.categoryName);
          if (!categoryId) {
            throw new Error(`Category not found: ${item.categoryName}`);
          }

          const result = await queryRunner.query(
            `INSERT INTO menu_items (
              category_id, name, description, base_price,
              is_active, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, true, NOW(), NOW())
            RETURNING menu_item_id`,
            [categoryId, item.name, item.description, item.basePrice]
          );

          menuItemIds.push(result[0].menu_item_id);
          console.log(`   ✅ ${item.name} - $${item.basePrice.toFixed(2)}`);
        }
        console.log(`✅ Created ${menuItemIds.length} menu items\n`);

        // Step 5: Associate all menu items with all active stores
        console.log('🔗 Associating menu items with stores...');
        let associationCount = 0;

        for (const store of stores) {
          for (const menuItemId of menuItemIds) {
            await queryRunner.query(
              `INSERT INTO store_menu_items (store_id, menu_item_id, created_at)
               VALUES ($1, $2, NOW())`,
              [store.store_id, menuItemId]
            );
            associationCount++;
          }
          console.log(`   ✅ ${store.name}: ${menuItemIds.length} items`);
        }
        console.log(`✅ Created ${associationCount} store-menu associations\n`);
        totalItemsCreated = menuItemIds.length;

      } else {
        // Legacy schema: Create separate item for each store
        console.log('   (Creating separate items for each store)\n');

        for (const store of stores) {
          console.log(`   📍 ${store.name}:`);
          for (const item of menuItems) {
            const categoryId = categoryMap.get(item.categoryName);
            if (!categoryId) {
              throw new Error(`Category not found: ${item.categoryName}`);
            }

            await queryRunner.query(
              `INSERT INTO menu_items (
                "storeId", category_id, name, description, base_price,
                is_active, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())`,
              [store.store_id, categoryId, item.name, item.description, item.basePrice]
            );
            totalItemsCreated++;
          }
          console.log(`      ✅ Created ${menuItems.length} items`);
        }
        console.log(`\n✅ Created ${totalItemsCreated} total menu items (${menuItems.length} items × ${stores.length} stores)\n`);
      }

      // Commit transaction
      await queryRunner.commitTransaction();
      console.log('✅ Transaction committed successfully\n');

      // Step 6: Verification
      console.log('🔍 Verifying seeded data...');
      const categoryCount = await queryRunner.query(`SELECT COUNT(*) as count FROM menu_categories`);
      const itemCount = await queryRunner.query(`SELECT COUNT(*) as count FROM menu_items`);
      const associationCountResult = await queryRunner.query(`SELECT COUNT(*) as count FROM store_menu_items`);

      console.log(`   Categories: ${categoryCount[0].count}`);
      console.log(`   Menu Items: ${itemCount[0].count}`);
      console.log(`   Store Associations: ${associationCountResult[0].count}`);
      console.log('');

      console.log('========================================');
      console.log('   ✅ MENU SEEDING COMPLETE!');
      console.log('========================================\n');

    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }

  } catch (error) {
    console.error('\n❌ Error seeding menu:', error);
    process.exit(1);
  } finally {
    // Close database connection
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Database connection closed\n');
    }
  }
}

// Run the seeding script
seedMenu();

