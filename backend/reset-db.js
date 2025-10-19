const pg = require('pg');

async function resetDatabase() {
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

    // Terminate all connections to only_coffee database
    console.log('Terminating connections to only_coffee...');
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'only_coffee'
      AND pid <> pg_backend_pid()
    `);

    // Drop the database
    console.log('Dropping only_coffee database...');
    await client.query('DROP DATABASE IF EXISTS only_coffee');

    // Create the database
    console.log('Creating only_coffee database...');
    await client.query('CREATE DATABASE only_coffee');

    console.log('✓ Database reset successfully');

    await client.end();
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

resetDatabase();

