const { Client } = require('pg');

async function checkData() {
  const client = new Client({
    host: 'only-coffee-db.cu96ksosqdq2.us-east-1.rds.amazonaws.com',
    port: 5432,
    user: 'postgres',
    password: 'Dieb4utr1I!',
    database: 'only_coffee',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check anonymous devices
    const devicesResult = await client.query('SELECT * FROM anonymous_devices ORDER BY created_at DESC LIMIT 5');
    console.log('📱 Anonymous Devices:');
    console.log(JSON.stringify(devicesResult.rows, null, 2));

    // Check recent splash events
    const eventsResult = await client.query('SELECT splash_event_id, event_type, device_id, user_id, created_at FROM splash_events ORDER BY created_at DESC LIMIT 5');
    console.log('\n🎯 Recent Splash Events:');
    console.log(JSON.stringify(eventsResult.rows, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkData();

