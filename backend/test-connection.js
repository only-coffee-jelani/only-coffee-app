const pg = require('pg');

async function testConnection() {
  console.log('Testing connection to AWS RDS...\n');

  // First try to connect to postgres database
  const client = new pg.Client({
    host: 'only-coffee-db.cu96ksosqdq2.us-east-1.rds.amazonaws.com',
    port: 5432,
    user: 'postgres',
    password: 'Dieb4utr1I!',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✓ Connected to postgres database');

    // Check if only_coffee database exists
    const res = await client.query(
      "SELECT datname FROM pg_database WHERE datname = 'only_coffee'"
    );

    if (res.rows.length > 0) {
      console.log('✓ Database only_coffee exists');
    } else {
      console.log('✗ Database only_coffee does NOT exist');
      console.log('Creating database...');
      await client.query('CREATE DATABASE only_coffee');
      console.log('✓ Created database only_coffee');
    }

    await client.end();
    console.log('\n✓ Connection test successful!');
  } catch (err) {
    console.error('✗ Connection error:', err.message);
    process.exit(1);
  }
}

testConnection();

