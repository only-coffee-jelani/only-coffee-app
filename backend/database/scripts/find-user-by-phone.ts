import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../services/gateway/.env') });

/**
 * Find user by phone number
 */
async function findUserByPhone(phone: string) {
  console.log(`🔧 Searching for user with phone: ${phone}`);
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

    // Search for user by phone
    const users = await dataSource.query(`
      SELECT id, email, phone, "firstName", "lastName", "createdAt"
      FROM users
      WHERE phone = $1;
    `, [phone]);

    if (users.length === 0) {
      console.log(`❌ No user found with phone: ${phone}`);
    } else {
      console.log(`\n✅ Found ${users.length} user(s):\n`);
      users.forEach((user: any) => {
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Phone: ${user.phone}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}

// Get phone from command line arguments
const phone = process.argv[2] || '5047770440';

// Run the script
findUserByPhone(phone)
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

