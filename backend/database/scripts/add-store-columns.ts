import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
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

async function addStoreColumns() {
  console.log('\n🔧 ========================================');
  console.log('   ADDING MISSING STORE COLUMNS');
  console.log('========================================\n');

  try {
    await dataSource.initialize();
    console.log('✅ Connected to database\n');

    // Add missing columns
    console.log('📝 Adding email column...');
    await dataSource.query(`
      ALTER TABLE stores
      ADD COLUMN IF NOT EXISTS email VARCHAR(255)
    `);

    console.log('📝 Adding accepting_orders column...');
    await dataSource.query(`
      ALTER TABLE stores
      ADD COLUMN IF NOT EXISTS accepting_orders BOOLEAN DEFAULT true
    `);

    console.log('📝 Adding store_image_url column...');
    await dataSource.query(`
      ALTER TABLE stores
      ADD COLUMN IF NOT EXISTS store_image_url VARCHAR(500)
    `);

    console.log('📝 Adding description column...');
    await dataSource.query(`
      ALTER TABLE stores
      ADD COLUMN IF NOT EXISTS description TEXT
    `);

    // Set default values for existing stores
    console.log('📝 Setting default values...');
    await dataSource.query(`
      UPDATE stores
      SET accepting_orders = true
      WHERE accepting_orders IS NULL
    `);

    console.log('\n✅ Successfully added all missing columns!\n');
    console.log('========================================');
    console.log('   COLUMN ADDITION COMPLETE!');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error adding columns:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

addStoreColumns();

