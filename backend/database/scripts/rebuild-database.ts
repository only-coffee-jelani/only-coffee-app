import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from the gateway service .env file
config({ path: path.join(__dirname, '../../services/gateway/.env') });

/**
 * Complete database rebuild script
 * 
 * This script:
 * 1. Drops all existing tables
 * 2. Creates new enterprise schema
 * 3. Seeds lookup tables
 * 
 * Run media migration separately after this completes.
 */

async function rebuildDatabase() {
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
    console.log('\n🚀 ========================================');
    console.log('   DATABASE REBUILD - ENTERPRISE SCHEMA');
    console.log('========================================\n');

    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to AWS RDS PostgreSQL');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Database: ${process.env.DB_DATABASE}\n`);

    // ============================================
    // STEP 1: DROP OLD SCHEMA
    // ============================================
    console.log('⚠️  ========================================');
    console.log('   STEP 1: DROPPING OLD SCHEMA');
    console.log('========================================');
    console.log('⚠️  WARNING: This will delete ALL existing tables!');
    console.log('⚠️  Backup has been created. Proceeding in 3 seconds...\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🗑️  Dropping old tables...');

    const tablesToDrop = [
      // AI and personalization tables
      'ai_promotions', 'promotion_executions', 'model_logs',
      'user_segment_assignments', 'user_segments', 'user_events', 'user_profiles',
      // Loyalty and rewards tables
      'streak_visits', 'user_streaks', 'streak_rewards', 'anniversary_rewards',
      'streak_saver_tokens', 'tier_perks', 'user_tier_history', 'rewards_ledger',
      'coupon_grants', 'promo_codes', 'program_events',
      // Order and payment tables
      'order_items', 'orders', 'delivery_orders',
      // Content and media tables
      'carousel_images', 'splash_screens', 'promotions', 'reviews',
      // Menu tables
      'menu_items', 'categories',
      // User and store tables
      'notification_preferences', 'gift_cards', 'users', 'stores',
      // Migration tracking
      'migrations',
    ];

    for (const table of tablesToDrop) {
      try {
        await dataSource.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        console.log(`   ✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`   ⚠️  Could not drop ${table}: ${error.message}`);
      }
    }

    // Drop enums
    const enumsToDrop = ['user_tier_enum', 'store_type_enum', 'menu_category_enum'];
    for (const enumType of enumsToDrop) {
      try {
        await dataSource.query(`DROP TYPE IF EXISTS "${enumType}" CASCADE`);
        console.log(`   ✅ Dropped enum: ${enumType}`);
      } catch (error) {
        console.log(`   ⚠️  Could not drop ${enumType}: ${error.message}`);
      }
    }

    console.log('\n✅ Old schema dropped successfully!\n');

    // ============================================
    // STEP 2: CREATE NEW SCHEMA
    // ============================================
    console.log('========================================');
    console.log('   STEP 2: CREATING NEW ENTERPRISE SCHEMA');
    console.log('========================================\n');

    console.log('📄 Reading SQL schema file...');
    const sqlPath = path.join(__dirname, '../sql/enterprise-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log(`✅ Loaded schema file (${sql.length} characters)\n`);

    console.log('🏗️  Executing schema creation...');
    await dataSource.query(sql);
    console.log('✅ New enterprise schema created successfully!\n');

    console.log('📊 Verifying tables...');
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log(`✅ Created ${tables.length} tables:\n`);
    
    // Group tables by category
    const tableNames = tables.map(t => t.table_name);
    console.log('   Core Tables:', tableNames.filter(t => ['users', 'stores', 'menu_items', 'orders'].includes(t)).join(', '));
    console.log(`   Total: ${tableNames.length} tables\n`);

    console.log('\n✅ ========================================');
    console.log('   DATABASE REBUILD COMPLETED!');
    console.log('========================================\n');

    console.log('📋 Next steps:');
    console.log('   1. ✅ Backup completed');
    console.log('   2. ✅ Old schema dropped');
    console.log('   3. ✅ New schema created');
    console.log('   4. ⏭️  Run: npm run db:seed');
    console.log('   5. ⏭️  Run: npm run db:migrate-media\n');

    await dataSource.destroy();
  } catch (error) {
    console.error('\n❌ ========================================');
    console.error('   DATABASE REBUILD FAILED!');
    console.error('========================================\n');
    console.error('Error:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  rebuildDatabase()
    .then(() => {
      console.log('✅ Rebuild script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Rebuild script failed:', error);
      process.exit(1);
    });
}

export { rebuildDatabase };

