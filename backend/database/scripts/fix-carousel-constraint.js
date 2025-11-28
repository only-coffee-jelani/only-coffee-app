const { Client } = require('pg');
require('dotenv').config({ path: './backend/services/gateway/.env' });

async function fixCarouselConstraint() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_DATABASE,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    console.log('🔧 Dropping carousel_events device_id foreign key constraint...');
    await client.query(`
      ALTER TABLE carousel_events
      DROP CONSTRAINT IF EXISTS carousel_events_device_id_fkey
    `);
    console.log('✅ Dropped constraint');

    console.log('📝 Adding documentation comment...');
    await client.query(`
      COMMENT ON COLUMN carousel_events.device_id IS 
      'Device ID - can reference either anonymous_devices.device_id (before login) or user_devices.device_id (after login). No FK constraint to support both.'
    `);
    console.log('✅ Added comment');

    console.log('🔍 Verifying constraint was removed...');
    const result = await client.query(`
      SELECT 
        conname AS constraint_name,
        contype AS constraint_type
      FROM pg_constraint
      WHERE conrelid = 'carousel_events'::regclass
      AND conname LIKE '%device%'
    `);
    
    if (result.rows.length === 0) {
      console.log('✅ No device-related constraints found - fix successful!');
    } else {
      console.log('⚠️  Found constraints:', result.rows);
    }

    console.log('\n🎉 Carousel events device constraint fix completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixCarouselConstraint();

