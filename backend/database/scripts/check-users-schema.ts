import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../services/gateway/.env') });

/**
 * Check the actual schema of the users table
 */
async function checkUsersSchema() {
  console.log('🔧 Connecting to database...');
  
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Connected to database');

    // Get table schema
    const schemaResult = await dataSource.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Users table schema:');
    console.log('─'.repeat(80));
    schemaResult.forEach((col: any) => {
      console.log(`Column: ${col.column_name.padEnd(25)} Type: ${col.data_type.padEnd(20)} Nullable: ${col.is_nullable}`);
    });
    console.log('─'.repeat(80));

    // Try to get a sample user
    console.log('\n📋 Sample user (if any):');
    const sampleResult = await dataSource.query(`
      SELECT * FROM users LIMIT 1;
    `);

    if (sampleResult.length > 0) {
      console.log(JSON.stringify(sampleResult[0], null, 2));
    } else {
      console.log('No users found in database');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
checkUsersSchema()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

