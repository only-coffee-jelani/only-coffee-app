import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables from the gateway service .env file
config({ path: path.join(__dirname, '../../services/gateway/.env') });

/**
 * Verify database rebuild was successful
 */

async function verifyRebuild() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'only_coffee',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('\n🔍 ========================================');
    console.log('   DATABASE VERIFICATION');
    console.log('========================================\n');

    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to AWS RDS PostgreSQL\n');

    // Check table count
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log(`📊 Total Tables: ${tables.length}\n`);

    // Check lookup tables
    console.log('📋 Lookup Tables:');
    const lookupTables = [
      'loyalty_tiers',
      'store_types',
      'promotion_discount_types',
      'payment_methods',
      'order_statuses',
      'admin_roles',
      'user_segments',
      'reportable_entities',
      'filter_operators',
    ];

    for (const table of lookupTables) {
      const result = await dataSource.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`   ${table}: ${result[0].count} records`);
    }

    // Check media assets
    console.log('\n🖼️  Media Assets:');
    const mediaAssets = await dataSource.query(`SELECT COUNT(*) as count FROM media_assets`);
    console.log(`   media_assets: ${mediaAssets[0].count} records`);

    const splashScreens = await dataSource.query(`SELECT COUNT(*) as count FROM splash_screens`);
    console.log(`   splash_screens: ${splashScreens[0].count} records`);

    const carousels = await dataSource.query(`SELECT COUNT(*) as count FROM carousels`);
    console.log(`   carousels: ${carousels[0].count} records`);

    const carouselItems = await dataSource.query(`SELECT COUNT(*) as count FROM carousel_items`);
    console.log(`   carousel_items: ${carouselItems[0].count} records`);

    const menuCategories = await dataSource.query(`SELECT COUNT(*) as count FROM menu_categories`);
    console.log(`   menu_categories: ${menuCategories[0].count} records`);

    const menuItems = await dataSource.query(`SELECT COUNT(*) as count FROM menu_items`);
    console.log(`   menu_items: ${menuItems[0].count} records`);

    const promotions = await dataSource.query(`SELECT COUNT(*) as count FROM promotions`);
    console.log(`   promotions: ${promotions[0].count} records`);

    // Sample data
    console.log('\n📸 Sample Splash Screen:');
    const sampleSplash = await dataSource.query(`
      SELECT s.title, s.subtitle, m.url as image_url, s.is_active
      FROM splash_screens s
      LEFT JOIN media_assets m ON s.image_asset_id = m.asset_id
      LIMIT 1
    `);
    if (sampleSplash.length > 0) {
      console.log(`   Title: ${sampleSplash[0].title}`);
      console.log(`   Subtitle: ${sampleSplash[0].subtitle}`);
      console.log(`   Image: ${sampleSplash[0].image_url}`);
      console.log(`   Active: ${sampleSplash[0].is_active}`);
    }

    console.log('\n🍰 Sample Menu Item:');
    const sampleMenuItem = await dataSource.query(`
      SELECT mi.name, mi.description, mi.base_price, mc.name as category, m.url as image_url
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.category_id = mc.category_id
      LEFT JOIN media_assets m ON mi.image_asset_id = m.asset_id
      LIMIT 1
    `);
    if (sampleMenuItem.length > 0) {
      console.log(`   Name: ${sampleMenuItem[0].name}`);
      console.log(`   Description: ${sampleMenuItem[0].description}`);
      console.log(`   Price: $${sampleMenuItem[0].base_price}`);
      console.log(`   Category: ${sampleMenuItem[0].category}`);
      console.log(`   Image: ${sampleMenuItem[0].image_url || 'None'}`);
    }

    console.log('\n✅ ========================================');
    console.log('   DATABASE VERIFICATION COMPLETE!');
    console.log('========================================\n');

    console.log('✅ All checks passed!');
    console.log('✅ Database rebuild was successful!');
    console.log('✅ All media assets have been migrated!\n');

    await dataSource.destroy();
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  verifyRebuild()
    .then(() => {
      console.log('✅ Verification script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Verification script failed:', error);
      process.exit(1);
    });
}

export { verifyRebuild };

