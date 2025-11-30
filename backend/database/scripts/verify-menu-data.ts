#!/usr/bin/env ts-node
/**
 * Menu Data Verification Script
 * 
 * Purpose: Verify the menu data in the database
 * Shows categories, items, and store associations
 * 
 * Usage: npx ts-node backend/database/scripts/verify-menu-data.ts
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

async function verifyMenuData() {
  let connection: DataSource | null = null;

  try {
    console.log('🔍 Menu Data Verification\n');
    console.log('=' .repeat(60));

    // Connect to database
    console.log('🔌 Connecting to database...');
    connection = await dataSource.initialize();
    console.log('✅ Connected\n');

    // Check stores
    console.log('📍 ACTIVE STORES:');
    console.log('-' .repeat(60));
    const stores = await connection.query(`
      SELECT store_id, name, is_active, city, state
      FROM stores
      WHERE is_active = true
      ORDER BY name
    `);
    
    if (stores.length === 0) {
      console.log('⚠️  No active stores found!\n');
    } else {
      stores.forEach((store: any, index: number) => {
        console.log(`${index + 1}. ${store.name}`);
        console.log(`   ID: ${store.store_id}`);
        if (store.city) console.log(`   Location: ${store.city}, ${store.state}`);
      });
      console.log(`\nTotal: ${stores.length} active store(s)\n`);
    }

    // Check categories
    console.log('📂 MENU CATEGORIES:');
    console.log('-' .repeat(60));
    const categories = await connection.query(`
      SELECT category_id, name, description, sort_order,
             (SELECT COUNT(*) FROM menu_items WHERE category_id = mc.category_id) as item_count
      FROM menu_categories mc
      ORDER BY sort_order
    `);
    
    if (categories.length === 0) {
      console.log('⚠️  No categories found!\n');
    } else {
      categories.forEach((cat: any) => {
        console.log(`${cat.sort_order}. ${cat.name} (${cat.item_count} items)`);
        console.log(`   ${cat.description}`);
      });
      console.log(`\nTotal: ${categories.length} categor${categories.length === 1 ? 'y' : 'ies'}\n`);
    }

    // Check menu items by category
    console.log('☕ MENU ITEMS BY CATEGORY:');
    console.log('-' .repeat(60));
    const items = await connection.query(`
      SELECT 
        mi.menu_item_id,
        mi.name,
        mi.base_price,
        mi.calories,
        mc.name as category_name,
        mc.sort_order as category_order,
        (SELECT COUNT(*) FROM store_menu_items WHERE menu_item_id = mi.menu_item_id) as store_count
      FROM menu_items mi
      JOIN menu_categories mc ON mi.category_id = mc.category_id
      ORDER BY mc.sort_order, mi.name
    `);
    
    if (items.length === 0) {
      console.log('⚠️  No menu items found!\n');
    } else {
      let currentCategory = '';
      items.forEach((item: any) => {
        if (item.category_name !== currentCategory) {
          currentCategory = item.category_name;
          console.log(`\n${currentCategory}:`);
        }
        console.log(`  • ${item.name} - $${parseFloat(item.base_price).toFixed(2)}`);
        if (item.calories) console.log(`    ${item.calories} cal | Available in ${item.store_count} store(s)`);
      });
      console.log(`\nTotal: ${items.length} menu item(s)\n`);
    }

    // Check store-menu associations
    console.log('🔗 STORE-MENU ASSOCIATIONS:');
    console.log('-' .repeat(60));
    const associations = await connection.query(`
      SELECT 
        s.name as store_name,
        COUNT(smi.menu_item_id) as item_count
      FROM stores s
      LEFT JOIN store_menu_items smi ON s.store_id = smi.store_id
      WHERE s.is_active = true
      GROUP BY s.store_id, s.name
      ORDER BY s.name
    `);
    
    if (associations.length === 0) {
      console.log('⚠️  No associations found!\n');
    } else {
      associations.forEach((assoc: any) => {
        console.log(`${assoc.store_name}: ${assoc.item_count} items`);
      });
      
      const totalAssociations = await connection.query(`
        SELECT COUNT(*) as count FROM store_menu_items
      `);
      console.log(`\nTotal: ${totalAssociations[0].count} association(s)\n`);
    }

    // Summary
    console.log('=' .repeat(60));
    console.log('📊 SUMMARY:');
    console.log(`   Stores: ${stores.length}`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Menu Items: ${items.length}`);
    const totalAssoc = await connection.query(`SELECT COUNT(*) as count FROM store_menu_items`);
    console.log(`   Associations: ${totalAssoc[0].count}`);
    console.log('=' .repeat(60));
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    if (connection && connection.isInitialized) {
      await connection.destroy();
    }
  }
}

if (require.main === module) {
  verifyMenuData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { verifyMenuData };

