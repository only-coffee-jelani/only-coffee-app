import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables from the gateway service .env file
config({ path: path.join(__dirname, '../../services/gateway/.env') });

/**
 * Seed script for lookup/enum tables in the new enterprise schema
 */

async function seedLookupTables() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'only_coffee',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to database');

    // Seed loyalty_tiers
    console.log('🏆 Seeding loyalty tiers...');
    await dataSource.query(`
      INSERT INTO loyalty_tiers (name, display_name, min_points, max_points)
      VALUES
        ('bronze', 'Bronze', 0, 499),
        ('silver', 'Silver', 500, 1499),
        ('gold', 'Gold', 1500, 2999),
        ('platinum', 'Platinum', 3000, 999999)
      ON CONFLICT (name) DO NOTHING
    `);

    // Seed store_types
    console.log('🏪 Seeding store types...');
    await dataSource.query(`
      INSERT INTO store_types (code, description)
      VALUES
        ('coffee_shop', 'Traditional coffee shop location'),
        ('food_truck', 'Mobile food truck'),
        ('kiosk', 'Small kiosk or stand'),
        ('popup', 'Temporary popup location')
      ON CONFLICT (code) DO NOTHING
    `);

    // Seed promotion_discount_types
    console.log('💰 Seeding promotion discount types...');
    await dataSource.query(`
      INSERT INTO promotion_discount_types (code, description)
      VALUES
        ('fixed', 'Fixed dollar amount discount'),
        ('percent', 'Percentage discount')
      ON CONFLICT (code) DO NOTHING
    `);

    // Seed payment_methods
    console.log('💳 Seeding payment methods...');
    await dataSource.query(`
      INSERT INTO payment_methods (code, description)
      VALUES
        ('card', 'Credit or debit card'),
        ('apple_pay', 'Apple Pay'),
        ('google_pay', 'Google Pay'),
        ('loyalty_points', 'Loyalty points redemption'),
        ('gift_card', 'Gift card')
      ON CONFLICT (code) DO NOTHING
    `);

    // Seed order_statuses
    console.log('📦 Seeding order statuses...');
    await dataSource.query(`
      INSERT INTO order_statuses (code, description)
      VALUES
        ('pending', 'Order placed, awaiting confirmation'),
        ('confirmed', 'Order confirmed by store'),
        ('preparing', 'Order is being prepared'),
        ('ready', 'Order is ready for pickup'),
        ('completed', 'Order has been completed'),
        ('cancelled', 'Order was cancelled')
      ON CONFLICT (code) DO NOTHING
    `);

    // Seed admin_roles
    console.log('👥 Seeding admin roles...');
    await dataSource.query(`
      INSERT INTO admin_roles (name, description)
      VALUES
        ('super_admin', 'Full system access'),
        ('ops_manager', 'Operations management access'),
        ('marketer', 'Marketing and promotions access'),
        ('analyst', 'Read-only analytics access'),
        ('store_manager', 'Individual store management')
      ON CONFLICT (name) DO NOTHING
    `);

    // Seed user_segments
    console.log('🎯 Seeding user segments...');
    await dataSource.query(`
      INSERT INTO user_segments (name, description)
      VALUES
        ('new_users', 'Users who joined in the last 30 days'),
        ('active_users', 'Users with 3+ orders in last 30 days'),
        ('at_risk', 'Users who haven''t ordered in 60+ days'),
        ('high_value', 'Users with LTV > $500'),
        ('loyalty_members', 'Users enrolled in loyalty program'),
        ('weekend_warriors', 'Users who primarily order on weekends'),
        ('morning_regulars', 'Users who order before 10am regularly')
      ON CONFLICT DO NOTHING
    `);

    // Seed reportable_entities
    console.log('📊 Seeding reportable entities...');
    await dataSource.query(`
      INSERT INTO reportable_entities (name, table_name)
      VALUES
        ('Orders', 'orders'),
        ('Users', 'users'),
        ('Menu Items', 'menu_items'),
        ('Stores', 'stores'),
        ('Promotions', 'promotions')
      ON CONFLICT DO NOTHING
    `);

    // Seed filter_operators
    console.log('🔍 Seeding filter operators...');
    await dataSource.query(`
      INSERT INTO filter_operators (data_type, operator)
      VALUES
        ('string', '='),
        ('string', '!='),
        ('string', 'contains'),
        ('string', 'starts_with'),
        ('string', 'ends_with'),
        ('number', '='),
        ('number', '!='),
        ('number', '>'),
        ('number', '<'),
        ('number', '>='),
        ('number', '<='),
        ('date', '='),
        ('date', 'before'),
        ('date', 'after'),
        ('date', 'between'),
        ('boolean', '=')
      ON CONFLICT DO NOTHING
    `);

    console.log('\n✅ All lookup tables seeded successfully!');
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error seeding lookup tables:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedLookupTables()
    .then(() => {
      console.log('\n✅ Seed script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seed script failed:', error);
      process.exit(1);
    });
}

export { seedLookupTables };

