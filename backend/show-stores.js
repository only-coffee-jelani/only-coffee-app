const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'services', 'gateway', '.env') });

async function showStores() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Show stores table
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📍 STORES TABLE');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const storesResult = await client.query(`
      SELECT 
        store_id,
        name,
        store_type_id,
        address,
        latitude,
        longitude,
        phone,
        toast_location_id,
        is_active,
        opened_at,
        created_at
      FROM stores
      ORDER BY name
    `);

    console.log(`Total stores: ${storesResult.rows.length}\n`);
    storesResult.rows.forEach((store, index) => {
      console.log(`${index + 1}. ${store.name}`);
      console.log(`   ID: ${store.store_id}`);
      console.log(`   Address: ${store.address || 'N/A'}`);
      console.log(`   Coordinates: ${store.latitude}, ${store.longitude}`);
      console.log(`   Phone: ${store.phone || 'N/A'}`);
      console.log(`   Toast Location ID: ${store.toast_location_id || 'N/A'}`);
      console.log(`   Active: ${store.is_active ? '✅ Yes' : '❌ No'}`);
      console.log(`   Created: ${store.created_at.toISOString()}`);
      console.log('');
    });

    // Show store_types table
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🏪 STORE_TYPES TABLE');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const storeTypesResult = await client.query(`
      SELECT 
        store_type_id,
        code,
        description,
        created_at
      FROM store_types
      ORDER BY code
    `);

    console.log(`Total store types: ${storeTypesResult.rows.length}\n`);
    storeTypesResult.rows.forEach((type, index) => {
      console.log(`${index + 1}. ${type.code}`);
      console.log(`   ID: ${type.store_type_id}`);
      console.log(`   Description: ${type.description || 'N/A'}`);
      console.log('');
    });

    // Show store_hours table
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🕐 STORE_HOURS TABLE');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const storeHoursResult = await client.query(`
      SELECT 
        sh.store_hours_id,
        sh.store_id,
        s.name as store_name,
        sh.day_of_week,
        sh.open_time,
        sh.close_time
      FROM store_hours sh
      JOIN stores s ON sh.store_id = s.store_id
      ORDER BY s.name, sh.day_of_week
    `);

    console.log(`Total store hours records: ${storeHoursResult.rows.length}\n`);
    
    // Group by store
    const hoursByStore = {};
    storeHoursResult.rows.forEach(hour => {
      if (!hoursByStore[hour.store_name]) {
        hoursByStore[hour.store_name] = [];
      }
      hoursByStore[hour.store_name].push(hour);
    });

    Object.keys(hoursByStore).forEach((storeName, index) => {
      console.log(`${index + 1}. ${storeName}`);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      hoursByStore[storeName].forEach(hour => {
        console.log(`   ${days[hour.day_of_week]}: ${hour.open_time} - ${hour.close_time}`);
      });
      console.log('');
    });

    // Show store_status_history table
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 STORE_STATUS_HISTORY TABLE');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const statusHistoryResult = await client.query(`
      SELECT 
        ssh.store_status_history_id,
        ssh.store_id,
        s.name as store_name,
        ssh.status,
        ssh.reason,
        ssh.changed_by,
        ssh.changed_at
      FROM store_status_history ssh
      JOIN stores s ON ssh.store_id = s.store_id
      ORDER BY ssh.changed_at DESC
      LIMIT 20
    `);

    console.log(`Total status history records: ${statusHistoryResult.rows.length}\n`);
    statusHistoryResult.rows.forEach((history, index) => {
      console.log(`${index + 1}. ${history.store_name}`);
      console.log(`   Status: ${history.status}`);
      console.log(`   Reason: ${history.reason || 'N/A'}`);
      console.log(`   Changed At: ${history.changed_at.toISOString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

showStores();

