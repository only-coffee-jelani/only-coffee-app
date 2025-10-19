const pg = require('pg');

async function listTables() {
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

    // Get all tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (res.rows.length === 0) {
      console.log('No tables found in the database.');
    } else {
      console.log('📊 Tables in only_coffee database:\n');
      res.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.table_name}`);
      });

      // Get detailed info for each table
      console.log('\n' + '='.repeat(60));
      console.log('📋 Table Details:\n');

      for (const row of res.rows) {
        const tableName = row.table_name;
        const columnsRes = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);

        console.log(`\n📌 ${tableName}:`);
        console.log('   Columns:');
        columnsRes.rows.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
          console.log(`   - ${col.column_name}: ${col.data_type} ${nullable}`);
        });

        // Get row count
        const countRes = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
        console.log(`   Rows: ${countRes.rows[0].count}`);
      }
    }

    await client.end();
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

listTables();

