const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'only_coffee',
});

async function applyMigration() {
  const client = await pool.connect();
  try {
    console.log('Applying migration: AddUniqueActiveConstraint...');
    
    // Create the unique index
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_splash_screens_unique_active 
      ON splash_screens (is_active) 
      WHERE is_active = true
    `);
    
    console.log('✅ Migration applied successfully!');
    console.log('✅ Unique constraint created: Only one active splash screen allowed at a time');
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration();

