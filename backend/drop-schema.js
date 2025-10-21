const { Client } = require('pg');

const client = new Client({
  host: 'only-coffee-db.cu96ksosqdq2.us-east-1.rds.amazonaws.com',
  port: 5432,
  user: 'postgres',
  password: 'Dieb4utr1I!',
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function dropSchema() {
  try {
    await client.connect();
    console.log('Connected to database');

    // First check what exists
    const result = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `);
    console.log('Existing tables:', result.rows.map(r => r.tablename));

    // Drop all tables and recreate schema
    await client.query('DROP SCHEMA IF EXISTS public CASCADE');
    console.log('Dropped public schema');

    await client.query('CREATE SCHEMA public');
    console.log('Created public schema');

    await client.query('GRANT ALL ON SCHEMA public TO postgres');
    await client.query('GRANT ALL ON SCHEMA public TO public');
    console.log('Granted permissions');

    console.log('Schema reset complete!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

dropSchema();
