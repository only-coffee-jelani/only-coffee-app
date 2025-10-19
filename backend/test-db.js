const pg = require('pg');

async function test() {
  // First, try to connect to postgres database
  const client1 = new pg.Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'admin',
    database: 'postgres'
  });

  try {
    await client1.connect();
    console.log('✓ Connected to postgres database');

    const res = await client1.query("SELECT datname FROM pg_database WHERE datname = 'only_coffee'");
    console.log('✓ Databases found:', res.rows);

    await client1.end();
  } catch (err) {
    console.error('✗ Error connecting to postgres:', err.message);
  }

  // Now try to connect to only_coffee database
  const client2 = new pg.Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'admin',
    database: 'only_coffee'
  });

  try {
    await client2.connect();
    console.log('✓ Connected to only_coffee database');
    await client2.end();
  } catch (err) {
    console.error('✗ Error connecting to only_coffee:', err.message);
  }
}

test();

