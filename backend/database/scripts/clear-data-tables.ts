import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables from the gateway service .env file
config({ path: path.join(__dirname, '../../services/gateway/.env') });

/**
 * Clear data tables (not lookup tables) to allow re-running migration
 */

async function clearDataTables() {
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
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to database\n');

    console.log('🗑️  Clearing data tables...');

    // Clear in correct order (respecting foreign keys)
    const tablesToClear = [
      'carousel_items',
      'carousels',
      'splash_screens',
      'menu_items',
      'menu_categories',
      'media_assets',
    ];

    for (const table of tablesToClear) {
      await dataSource.query(`TRUNCATE TABLE ${table} CASCADE`);
      console.log(`   ✅ Cleared: ${table}`);
    }

    console.log('\n✅ Data tables cleared successfully!');
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error clearing data tables:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  clearDataTables()
    .then(() => {
      console.log('\n✅ Clear script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Clear script failed:', error);
      process.exit(1);
    });
}

export { clearDataTables };

