const pg = require('pg');

async function createDatabase() {
  // Connect to the default postgres database
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

    // Check if database exists
    const checkRes = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'only_coffee'"
    );

    if (checkRes.rows.length > 0) {
      console.log('✓ Database only_coffee already exists');
    } else {
      // Create the database
      await client.query('CREATE DATABASE only_coffee');
      console.log('✓ Created database only_coffee');
    }

    await client.end();
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

createDatabase();

