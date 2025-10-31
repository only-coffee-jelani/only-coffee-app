const pg = require('pg');

async function checkEnum() {
  const client = new pg.Client({
    host: 'only-coffee-db.cu96ksosqdq2.us-east-1.rds.amazonaws.com',
    port: 5432,
    user: 'postgres',
    password: 'Dieb4utr1I!',
    database: 'only_coffee',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Checking enum values...\n');

    // Check the enum type
    const res = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'users_loyaltytier_enum'
      )
      ORDER BY enumsortorder
    `);

    console.log('Available loyalty tier values:');
    res.rows.forEach(row => {
      console.log(`  - ${row.enumlabel}`);
    });

    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkEnum();

