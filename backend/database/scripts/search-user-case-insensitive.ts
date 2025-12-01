import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../services/gateway/.env') });

/**
 * Search for user with case-insensitive email search
 */
async function searchUser(email: string) {
  console.log(`🔧 Searching for user with email: ${email}`);
  console.log('🔧 Connecting to database...');
  
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'only_coffee',
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Connected to database');

    // Search with exact match
    console.log('\n1️⃣ Exact match search:');
    const exactMatch = await dataSource.query(`
      SELECT id, email, "firstName", "lastName", phone
      FROM users
      WHERE email = $1;
    `, [email]);
    console.log(`   Found ${exactMatch.length} users`);
    if (exactMatch.length > 0) {
      console.log('   ', JSON.stringify(exactMatch[0], null, 2));
    }

    // Search with case-insensitive match
    console.log('\n2️⃣ Case-insensitive search:');
    const caseInsensitiveMatch = await dataSource.query(`
      SELECT id, email, "firstName", "lastName", phone
      FROM users
      WHERE LOWER(email) = LOWER($1);
    `, [email]);
    console.log(`   Found ${caseInsensitiveMatch.length} users`);
    if (caseInsensitiveMatch.length > 0) {
      console.log('   ', JSON.stringify(caseInsensitiveMatch[0], null, 2));
    }

    // Search with LIKE
    console.log('\n3️⃣ LIKE search:');
    const likeMatch = await dataSource.query(`
      SELECT id, email, "firstName", "lastName", phone
      FROM users
      WHERE email LIKE $1;
    `, [`%${email}%`]);
    console.log(`   Found ${likeMatch.length} users`);
    if (likeMatch.length > 0) {
      likeMatch.forEach((user: any) => {
        console.log(`   - ${user.email} (${user.firstName} ${user.lastName})`);
      });
    }

    // List all users
    console.log('\n4️⃣ All users in database:');
    const allUsers = await dataSource.query(`
      SELECT id, email, "firstName", "lastName"
      FROM users
      ORDER BY "createdAt" DESC;
    `);
    console.log(`   Total: ${allUsers.length} users`);
    allUsers.forEach((user: any) => {
      console.log(`   - ${user.email}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('\n🔌 Database connection closed');
  }
}

// Get email from command line arguments
const email = process.argv[2] || 'senaiayalew@gmail.com';

// Run the script
searchUser(email)
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

