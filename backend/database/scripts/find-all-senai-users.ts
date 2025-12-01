import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../services/gateway/.env') });

/**
 * Find all users with "senai" in their email
 */
async function findSenaiUsers() {
  console.log(`🔧 Searching for users with "senai" in email`);
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

    // Search for users with "senai" in email (case-insensitive)
    const users = await dataSource.query(`
      SELECT id, email, phone, "firstName", "lastName", "createdAt"
      FROM users
      WHERE LOWER(email) LIKE LOWER('%senai%')
      ORDER BY "createdAt" DESC;
    `);

    console.log(`\n📊 Found ${users.length} user(s) with "senai" in email:\n`);
    
    if (users.length === 0) {
      console.log('   No users found');
    } else {
      users.forEach((user: any, index: number) => {
        console.log(`${index + 1}. User ID: ${user.id}`);
        console.log(`   Email: "${user.email}"`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Phone: ${user.phone || 'N/A'}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    }

    // Also list ALL users
    console.log('\n📋 ALL USERS IN DATABASE:\n');
    const allUsers = await dataSource.query(`
      SELECT id, email, phone, "firstName", "lastName"
      FROM users
      ORDER BY "createdAt" DESC
      LIMIT 10;
    `);

    allUsers.forEach((user: any, index: number) => {
      console.log(`${index + 1}. ${user.email} (${user.firstName} ${user.lastName})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
findSenaiUsers()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

