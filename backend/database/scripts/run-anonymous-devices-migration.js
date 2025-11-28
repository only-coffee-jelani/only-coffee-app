const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    host: 'only-coffee-db.cu96ksosqdq2.us-east-1.rds.amazonaws.com',
    port: 5432,
    user: 'postgres',
    password: 'Dieb4utr1I!',
    database: 'only_coffee',
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-anonymous-devices.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🚀 Running migration...');
    const result = await client.query(sql);
    console.log('✅ Migration completed successfully!');
    console.log('Result:', result);

  } catch (error) {
    console.error('❌ Migration failed:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('👋 Disconnected from database');
  }
}

runMigration().catch(console.error);

