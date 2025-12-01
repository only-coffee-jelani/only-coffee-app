import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../services/gateway/.env') });

async function addMissingUserColumns() {
  console.log('🔧 Adding missing columns to users table...');

  // Create a temporary data source
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'only_coffee',
    synchronize: false,
    logging: true,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    // Initialize connection
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'add-missing-user-columns.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute SQL
    await dataSource.query(sql);

    console.log('✅ Successfully added missing columns to users table');
  } catch (error) {
    console.error('❌ Error adding columns:', error);
    throw error;
  } finally {
    // Close connection
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('✅ Database connection closed');
    }
  }
}

// Run the script
addMissingUserColumns()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

