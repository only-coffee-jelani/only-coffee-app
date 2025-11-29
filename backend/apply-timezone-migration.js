const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'only-coffee-db.cu96ksosqdq2.us-east-1.rds.amazonaws.com',
  port: 5432,
  database: 'only_coffee',
  user: 'postgres',
  password: 'Dieb4utr1I!',
  ssl: { rejectUnauthorized: false }
});

const sql = fs.readFileSync('database/migrations/add-store-timezone.sql', 'utf8');

client.connect()
  .then(() => {
    console.log('🔗 Connected to database');
    return client.query(sql);
  })
  .then(() => {
    console.log('✅ Migration applied successfully!');
    return client.query('SELECT store_id, name, timezone FROM stores ORDER BY name');
  })
  .then(res => {
    console.log('\n📍 Stores with timezones:');
    res.rows.forEach(r => {
      console.log(`  - ${r.name}: ${r.timezone}`);
    });
    client.end();
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    client.end();
    process.exit(1);
  });

