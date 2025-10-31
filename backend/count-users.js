const pg = require('pg');

async function countUsers() {
  console.log('Counting users in the database...\n');

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

    // Count total users
    const totalRes = await client.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = totalRes.rows[0].count;

    // Count active users
    const activeRes = await client.query('SELECT COUNT(*) as count FROM users WHERE "isActive" = true');
    const activeUsers = activeRes.rows[0].count;

    // Count loyalty members
    const loyaltyRes = await client.query('SELECT COUNT(*) as count FROM users WHERE "isLoyaltyMember" = true');
    const loyaltyMembers = loyaltyRes.rows[0].count;

    // Count by tier
    const tierRes = await client.query(`
      SELECT "loyaltyTier", COUNT(*) as count 
      FROM users 
      GROUP BY "loyaltyTier" 
      ORDER BY count DESC
    `);

    // Get average lifetime value
    const avgRes = await client.query(`
      SELECT
        COUNT(DISTINCT u.id) as total_users,
        COALESCE(AVG(CAST(u."loyaltyPoints" AS DECIMAL)), 0) as avg_points,
        COALESCE(SUM(CAST(o."subtotal" AS DECIMAL)), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o."userId"
    `);

    const stats = avgRes.rows[0];

    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    USER STATISTICS                         ');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`📊 Total Users:              ${totalUsers}`);
    console.log(`👥 Active Users:             ${activeUsers}`);
    console.log(`🏆 Loyalty Members:          ${loyaltyMembers}`);
    console.log(`💰 Avg Loyalty Points:       ${Math.round(stats.avg_points)}`);
    console.log(`💵 Total Spent (All Users):  $${parseFloat(stats.total_spent).toFixed(2)}\n`);

    console.log('Breakdown by Loyalty Tier:');
    console.log('─────────────────────────────────────────────────────────────');
    tierRes.rows.forEach(row => {
      const tier = row.loyaltyTier || 'NULL';
      const count = row.count;
      const percentage = ((count / totalUsers) * 100).toFixed(1);
      console.log(`  ${tier.padEnd(12)} : ${count.toString().padStart(5)} users (${percentage}%)`);
    });

    console.log('\n═══════════════════════════════════════════════════════════\n');

    await client.end();
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

countUsers();

