import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from gateway service
dotenv.config({ path: path.join(__dirname, '../../services/gateway/.env') });

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'only_coffee',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function addNameColumn() {
  try {
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to database');

    // Add name column to order_statuses table
    console.log('📝 Adding name column to order_statuses table...');
    await dataSource.query(`
      ALTER TABLE order_statuses
      ADD COLUMN IF NOT EXISTS name VARCHAR(100);
    `);

    // Update name column with capitalized version of code
    console.log('📝 Updating name column with capitalized codes...');
    await dataSource.query(`
      UPDATE order_statuses
      SET name = INITCAP(code)
      WHERE name IS NULL;
    `);

    // Add name column to payment_methods table (for consistency)
    console.log('📝 Adding name column to payment_methods table...');
    await dataSource.query(`
      ALTER TABLE payment_methods
      ADD COLUMN IF NOT EXISTS name VARCHAR(100);
    `);

    // Update name column with formatted version of code
    console.log('📝 Updating payment_methods name column...');
    await dataSource.query(`
      UPDATE payment_methods
      SET name = CASE
        WHEN code = 'card' THEN 'Credit/Debit Card'
        WHEN code = 'apple_pay' THEN 'Apple Pay'
        WHEN code = 'google_pay' THEN 'Google Pay'
        WHEN code = 'loyalty_points' THEN 'Loyalty Points'
        WHEN code = 'gift_card' THEN 'Gift Card'
        ELSE INITCAP(REPLACE(code, '_', ' '))
      END
      WHERE name IS NULL;
    `);

    console.log('✅ Name columns added and populated successfully!');

    await dataSource.destroy();
    console.log('✅ Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addNameColumn();

