const { DataSource } = require('typeorm');
const { join } = require('path');
require('dotenv').config({ path: join(__dirname, 'services/gateway/.env') });

async function runMigration() {
  console.log('🚀 Running AddIsActiveToCarouselItems migration...');
  console.log('📍 Database Host:', process.env.DB_HOST);
  console.log('📍 Database Name:', process.env.DB_DATABASE);

  const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [],
    migrations: [],
    synchronize: false,
    logging: true,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // Run the migration manually
    console.log('🔄 Adding is_active column to carousel_items...');
    
    // Add is_active column
    await AppDataSource.query(`
      ALTER TABLE carousel_items 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true
    `);
    console.log('✅ Added is_active column');

    // Create index
    await AppDataSource.query(`
      CREATE INDEX IF NOT EXISTS "IDX_carousel_items_carousel_active_sort" 
      ON carousel_items (carousel_id, is_active, sort_order)
    `);
    console.log('✅ Created composite index');

    // Set all existing items to active
    await AppDataSource.query(`
      UPDATE carousel_items 
      SET is_active = true 
      WHERE is_active IS NULL
    `);
    console.log('✅ Set all existing carousel items to active');

    // Record migration in migrations table
    await AppDataSource.query(`
      INSERT INTO migrations (timestamp, name)
      VALUES (1732700000000, 'AddIsActiveToCarouselItems1732700000000')
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Recorded migration in migrations table');

    await AppDataSource.destroy();
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();

