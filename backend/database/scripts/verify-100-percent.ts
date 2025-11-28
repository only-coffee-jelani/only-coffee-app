import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../services/gateway/.env') });

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function verify100Percent() {
  console.log('\n✅ ========================================');
  console.log('   100% DATABASE COMPLETION VERIFICATION');
  console.log('========================================\n');

  try {
    await dataSource.initialize();
    console.log('🔌 Connected to AWS RDS PostgreSQL\n');

    let allChecks = true;

    // Check 1: Tables
    const tables = await dataSource.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    const tableCount = parseInt(tables[0].count);
    console.log(`📊 Total Tables: ${tableCount} ${tableCount >= 57 ? '✅' : '❌'}`);

    // Check 2: Lookup Tables
    console.log('\n📋 Lookup Tables:');
    const lookupTables = [
      'loyalty_tiers',
      'store_types',
      'promotion_discount_types',
      'payment_methods',
      'order_statuses',
      'admin_roles',
      'user_segments',
      'reportable_entities',
      'filter_operators'
    ];

    for (const table of lookupTables) {
      const result = await dataSource.query(`SELECT COUNT(*) as count FROM ${table}`);
      const count = parseInt(result[0].count);
      const status = count > 0 ? '✅' : '❌';
      console.log(`   ${status} ${table}: ${count} records`);
      if (count === 0) allChecks = false;
    }

    // Check 3: Stores
    console.log('\n🏪 Stores:');
    const stores = await dataSource.query(`SELECT COUNT(*) as count FROM stores`);
    const storeCount = parseInt(stores[0].count);
    const storeStatus = storeCount > 0 ? '✅' : '❌';
    console.log(`   ${storeStatus} stores: ${storeCount} records`);
    if (storeCount === 0) allChecks = false;

    const storeHours = await dataSource.query(`SELECT COUNT(*) as count FROM store_hours`);
    const hoursCount = parseInt(storeHours[0].count);
    const hoursStatus = hoursCount > 0 ? '✅' : '❌';
    console.log(`   ${hoursStatus} store_hours: ${hoursCount} records`);
    if (hoursCount === 0) allChecks = false;

    // Check 4: Admin Users
    console.log('\n👤 Admin Users:');
    const adminUsers = await dataSource.query(`SELECT COUNT(*) as count FROM admin_users`);
    const adminCount = parseInt(adminUsers[0].count);
    const adminStatus = adminCount > 0 ? '✅' : '❌';
    console.log(`   ${adminStatus} admin_users: ${adminCount} records`);
    if (adminCount === 0) allChecks = false;

    const adminRoles = await dataSource.query(`SELECT COUNT(*) as count FROM admin_user_roles`);
    const roleCount = parseInt(adminRoles[0].count);
    const roleStatus = roleCount > 0 ? '✅' : '❌';
    console.log(`   ${roleStatus} admin_user_roles: ${roleCount} records`);
    if (roleCount === 0) allChecks = false;

    // Check 5: Media Assets
    console.log('\n🖼️  Media Assets:');
    const mediaAssets = await dataSource.query(`SELECT COUNT(*) as count FROM media_assets`);
    const mediaCount = parseInt(mediaAssets[0].count);
    const mediaStatus = mediaCount > 0 ? '✅' : '❌';
    console.log(`   ${mediaStatus} media_assets: ${mediaCount} records`);
    if (mediaCount === 0) allChecks = false;

    const splashScreens = await dataSource.query(`SELECT COUNT(*) as count FROM splash_screens`);
    const splashCount = parseInt(splashScreens[0].count);
    const splashStatus = splashCount > 0 ? '✅' : '❌';
    console.log(`   ${splashStatus} splash_screens: ${splashCount} records`);
    if (splashCount === 0) allChecks = false;

    const carousels = await dataSource.query(`SELECT COUNT(*) as count FROM carousels`);
    const carouselCount = parseInt(carousels[0].count);
    const carouselStatus = carouselCount > 0 ? '✅' : '❌';
    console.log(`   ${carouselStatus} carousels: ${carouselCount} records`);
    if (carouselCount === 0) allChecks = false;

    // Check 6: Menu
    console.log('\n🍰 Menu:');
    const menuCategories = await dataSource.query(`SELECT COUNT(*) as count FROM menu_categories`);
    const categoryCount = parseInt(menuCategories[0].count);
    const categoryStatus = categoryCount > 0 ? '✅' : '❌';
    console.log(`   ${categoryStatus} menu_categories: ${categoryCount} records`);
    if (categoryCount === 0) allChecks = false;

    const menuItems = await dataSource.query(`SELECT COUNT(*) as count FROM menu_items`);
    const itemCount = parseInt(menuItems[0].count);
    const itemStatus = itemCount > 0 ? '✅' : '❌';
    console.log(`   ${itemStatus} menu_items: ${itemCount} records`);
    if (itemCount === 0) allChecks = false;

    const menuItemsWithImages = await dataSource.query(`
      SELECT COUNT(*) as count FROM menu_items WHERE image_asset_id IS NOT NULL
    `);
    const imagesLinked = parseInt(menuItemsWithImages[0].count);
    console.log(`   ℹ️  menu_items with images: ${imagesLinked}/${itemCount}`);

    // Final Summary
    console.log('\n========================================');
    if (allChecks) {
      console.log('   ✅ DATABASE IS 100% COMPLETE!');
    } else {
      console.log('   ⚠️  SOME CHECKS FAILED');
    }
    console.log('========================================\n');

    console.log('📊 Summary:');
    console.log(`   • ${tableCount} tables created`);
    console.log(`   • ${lookupTables.length} lookup tables seeded`);
    console.log(`   • ${storeCount} stores with ${hoursCount} hours records`);
    console.log(`   • ${adminCount} admin users with ${roleCount} role assignments`);
    console.log(`   • ${mediaCount} media assets`);
    console.log(`   • ${splashCount} splash screens`);
    console.log(`   • ${carouselCount} carousels`);
    console.log(`   • ${categoryCount} menu categories`);
    console.log(`   • ${itemCount} menu items (${imagesLinked} with images)\n`);

  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

verify100Percent();

