import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../services/gateway/.env') });

/**
 * List all users in the database
 */
async function listAllUsers() {
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

    // Get all users
    const users = await dataSource.query(`
      SELECT id, email, "firstName", "lastName", phone, "createdAt"
      FROM users
      ORDER BY "createdAt" DESC;
    `);

    console.log(`\n📋 Found ${users.length} users:\n`);
    console.log('─'.repeat(120));
    console.log('ID'.padEnd(38) + 'Email'.padEnd(35) + 'Name'.padEnd(25) + 'Phone'.padEnd(15) + 'Created');
    console.log('─'.repeat(120));

    users.forEach((user: any) => {
      const id = user.id.substring(0, 36).padEnd(38);
      const email = (user.email || '').substring(0, 33).padEnd(35);
      const name = `${user.firstName || ''} ${user.lastName || ''}`.substring(0, 23).padEnd(25);
      const phone = (user.phone || 'N/A').padEnd(15);
      const created = new Date(user.createdAt).toLocaleDateString();
      
      console.log(`${id}${email}${name}${phone}${created}`);
    });

    console.log('─'.repeat(120));

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
listAllUsers()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

