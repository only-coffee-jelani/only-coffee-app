import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../services/gateway/.env') });

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function seedAdminUser() {
  console.log('\n👤 ========================================');
  console.log('   SEEDING ADMIN USER');
  console.log('========================================\n');

  try {
    await dataSource.initialize();
    console.log('✅ Connected to database\n');

    // Get super_admin role ID
    const roles = await dataSource.query(`
      SELECT admin_role_id, name FROM admin_roles WHERE name = 'super_admin'
    `);
    
    if (roles.length === 0) {
      throw new Error('super_admin role not found. Please run seed-lookup-tables.ts first.');
    }

    const superAdminRoleId = roles[0].admin_role_id;
    console.log('📋 Found super_admin role:', superAdminRoleId);

    // Check if admin user already exists
    const existingAdmin = await dataSource.query(`
      SELECT admin_user_id, email FROM admin_users WHERE email = 'admin@onlycoffee.com'
    `);

    if (existingAdmin.length > 0) {
      console.log('⚠️  Admin user already exists:', existingAdmin[0].email);
      console.log('🔄 Updating password...\n');
      
      // Hash the password
      const passwordHash = await bcrypt.hash('Admin123!', 10);
      
      // Update existing admin user
      await dataSource.query(`
        UPDATE admin_users 
        SET password_hash = $1, 
            first_name = 'Admin',
            last_name = 'User',
            is_active = true,
            updated_at = NOW()
        WHERE email = 'admin@onlycoffee.com'
      `, [passwordHash]);
      
      console.log('✅ Admin user updated successfully!\n');
    } else {
      console.log('📝 Creating new admin user...\n');
      
      // Hash the password
      const passwordHash = await bcrypt.hash('Admin123!', 10);
      
      // Create admin user
      const result = await dataSource.query(`
        INSERT INTO admin_users (
          email, password_hash, first_name, last_name, is_active
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING admin_user_id, email
      `, [
        'admin@onlycoffee.com',
        passwordHash,
        'Admin',
        'User',
        true
      ]);
      
      const adminUserId = result[0].admin_user_id;
      console.log(`   ✅ Admin user created: ${result[0].email}`);
      console.log(`   🆔 Admin user ID: ${adminUserId}\n`);
      
      // Assign super_admin role
      console.log('🔐 Assigning super_admin role...');
      await dataSource.query(`
        INSERT INTO admin_user_roles (admin_user_id, admin_role_id)
        VALUES ($1, $2)
        ON CONFLICT (admin_user_id, admin_role_id) DO NOTHING
      `, [adminUserId, superAdminRoleId]);
      
      console.log('✅ Super admin role assigned!\n');
    }

    console.log('========================================');
    console.log('   ADMIN USER CREDENTIALS');
    console.log('========================================');
    console.log('📧 Email:    admin@onlycoffee.com');
    console.log('🔑 Password: Admin123!');
    console.log('🔐 Role:     super_admin');
    console.log('========================================\n');

    console.log('⚠️  IMPORTANT: Change this password after first login!\n');

    console.log('========================================');
    console.log('   ADMIN USER SEEDING COMPLETE!');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

seedAdminUser();

