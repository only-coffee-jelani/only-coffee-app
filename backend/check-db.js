const pg = require('pg');

async function checkDatabase() {
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
    console.log('✓ Connected to only_coffee database\n');

    // Get all tables including system tables
    const res = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      ORDER BY table_schema, table_name
    `);

    console.log('All tables in database:');
    res.rows.forEach(row => {
      console.log(`  ${row.table_schema}.${row.table_name}`);
    });

    // Check for specific tables
    console.log('\n\nChecking for specific tables:');
    const tables = ['users', 'stores', 'menu_items', 'orders', 'reviews', 'rewards_ledger', 'gift_cards', 'delivery_orders', 'promotions'];
    
    for (const table of tables) {
      const checkRes = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        )
      `, [table]);
      
      const exists = checkRes.rows[0].exists ? '✓' : '✗';
      console.log(`${exists} ${table}`);
    }

    await client.end();
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

checkDatabase();

