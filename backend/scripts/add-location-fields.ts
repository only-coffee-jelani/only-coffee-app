import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../services/gateway/.env') });

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function addLocationFields() {
  try {
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to database');

    console.log('📝 Adding location fields to stores table...');
    
    await dataSource.query(`
      ALTER TABLE stores 
      ADD COLUMN IF NOT EXISTS city VARCHAR(100),
      ADD COLUMN IF NOT EXISTS state VARCHAR(100),
      ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20),
      ADD COLUMN IF NOT EXISTS country VARCHAR(100),
      ADD COLUMN IF NOT EXISTS country_code VARCHAR(2),
      ADD COLUMN IF NOT EXISTS continent VARCHAR(50);
    `);

    console.log('✅ Added location fields');

    console.log('📊 Creating indexes...');
    
    await dataSource.query(`
      CREATE INDEX IF NOT EXISTS "IDX_stores_country_code" ON "stores" ("country_code");
    `);
    
    await dataSource.query(`
      CREATE INDEX IF NOT EXISTS "IDX_stores_continent" ON "stores" ("continent");
    `);
    
    await dataSource.query(`
      CREATE INDEX IF NOT EXISTS "IDX_stores_city_state" ON "stores" ("city", "state");
    `);

    console.log('✅ Created indexes');

    console.log('🎉 Migration completed successfully!');
    
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

addLocationFields();

