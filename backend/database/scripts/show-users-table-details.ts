import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../services/gateway/.env') });

/**
 * Show complete users table schema and data
 */
async function showUsersTable() {
  console.log(`🔧 Fetching users table details`);
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
    console.log('✅ Connected to database\n');

    // Get table schema with detailed information
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    USERS TABLE SCHEMA');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const columns = await dataSource.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('Column Details:\n');
    columns.forEach((col: any, index: number) => {
      const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? `DEFAULT ${col.column_default}` : '';
      
      console.log(`${(index + 1).toString().padStart(2)}. ${col.column_name.padEnd(25)} ${col.data_type}${length}`.padEnd(60) + nullable.padEnd(10) + defaultVal);
    });

    // Get constraints
    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('                    TABLE CONSTRAINTS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const constraints = await dataSource.query(`
      SELECT
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      LEFT JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_name = 'users'
      ORDER BY tc.constraint_type, tc.constraint_name;
    `);

    const groupedConstraints: any = {};
    constraints.forEach((c: any) => {
      if (!groupedConstraints[c.constraint_type]) {
        groupedConstraints[c.constraint_type] = [];
      }
      groupedConstraints[c.constraint_type].push(c);
    });

    Object.keys(groupedConstraints).forEach(type => {
      console.log(`${type}:`);
      groupedConstraints[type].forEach((c: any) => {
        if (c.foreign_table_name) {
          console.log(`  - ${c.constraint_name}: ${c.column_name} -> ${c.foreign_table_name}(${c.foreign_column_name})`);
        } else {
          console.log(`  - ${c.constraint_name}: ${c.column_name}`);
        }
      });
      console.log('');
    });

    // Get indexes
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    TABLE INDEXES');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const indexes = await dataSource.query(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'users'
      ORDER BY indexname;
    `);

    indexes.forEach((idx: any) => {
      console.log(`${idx.indexname}:`);
      console.log(`  ${idx.indexdef}\n`);
    });

    // Get all users
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    ALL USERS IN TABLE');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const users = await dataSource.query(`
      SELECT 
        user_id,
        email,
        phone,
        first_name,
        last_name,
        birthdate,
        loyalty_points,
        email_verified,
        phone_verified,
        is_active,
        role,
        created_at,
        updated_at
      FROM users
      ORDER BY created_at DESC;
    `);

    console.log(`Total Users: ${users.length}\n`);

    users.forEach((user: any, index: number) => {
      console.log(`${index + 1}. ${user.email || 'No Email'}`);
      console.log(`   User ID: ${user.user_id}`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Phone: ${user.phone || 'N/A'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Loyalty Points: ${user.loyalty_points}`);
      console.log(`   Email Verified: ${user.email_verified}`);
      console.log(`   Phone Verified: ${user.phone_verified}`);
      console.log(`   Active: ${user.is_active}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Updated: ${user.updated_at}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
showUsersTable()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

