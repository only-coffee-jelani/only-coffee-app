import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../services/gateway/.env') });

/**
 * Enterprise-level script to delete a user by email
 * Usage: npx ts-node -r tsconfig-paths/register backend/database/scripts/delete-user-by-email.ts <email>
 */
async function deleteUserByEmail(email: string) {
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

    // Check if user exists (using camelCase column names)
    const userResult = await dataSource.query(
      'SELECT id, email, "firstName", "lastName", phone, "createdAt" FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (userResult.length === 0) {
      console.log(`❌ No user found with email: ${email}`);
      return;
    }

    const user = userResult[0];
    const userId = user.id;
    console.log('\n📋 User found:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Phone: ${user.phone || 'N/A'}`);
    console.log(`   Created: ${user.createdAt}`);

    // Delete related records first (foreign key constraints)
    console.log('\n🗑️  Deleting related records...');

    // Note: Using camelCase column names as per the actual database schema
    // The database uses camelCase, not snake_case

    // Delete orders (if table exists)
    try {
      const ordersResult = await dataSource.query(
        'DELETE FROM orders WHERE "userId" = $1',
        [userId]
      );
      console.log(`   Deleted ${ordersResult[1] || 0} orders`);
    } catch (error: any) {
      if (error.code !== '42P01') { // Table doesn't exist
        console.log(`   ⚠️  Could not delete orders: ${error.message}`);
      }
    }

    // Delete the user
    console.log('\n🗑️  Deleting user...');
    await dataSource.query(
      'DELETE FROM users WHERE id = $1',
      [userId]
    );

    console.log(`✅ Successfully deleted user: ${email}`);
    console.log('\n✨ You can now register with this email again!');

  } catch (error) {
    console.error('❌ Error deleting user:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('\n🔌 Database connection closed');
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Email address is required');
  console.log('\nUsage: npx ts-node -r tsconfig-paths/register backend/database/scripts/delete-user-by-email.ts <email>');
  console.log('Example: npx ts-node -r tsconfig-paths/register backend/database/scripts/delete-user-by-email.ts senaiayalew@gmail.com');
  process.exit(1);
}

// Run the script
deleteUserByEmail(email)
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

