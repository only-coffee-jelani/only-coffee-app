const pg = require('pg');

async function getUserRankings() {
  console.log('📊 Generating User Rankings...\n');

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

    // Top users by loyalty points
    const topPointsRes = await client.query(`
      SELECT 
        "firstName", "lastName", email, "loyaltyTier", "loyaltyPoints", "isActive"
      FROM users
      WHERE "loyaltyPoints" > 0
      ORDER BY "loyaltyPoints" DESC
      LIMIT 10
    `);

    // Most active users
    const activeRes = await client.query(`
      SELECT 
        "firstName", "lastName", email, "loyaltyTier", "isActive", "lastLoginAt"
      FROM users
      WHERE "isActive" = true
      ORDER BY "lastLoginAt" DESC NULLS LAST
      LIMIT 10
    `);

    // Loyalty members by tier
    const tierRes = await client.query(`
      SELECT 
        "loyaltyTier", 
        COUNT(*) as total,
        SUM(CASE WHEN "isLoyaltyMember" = true THEN 1 ELSE 0 END) as members,
        AVG("loyaltyPoints") as avg_points
      FROM users
      GROUP BY "loyaltyTier"
      ORDER BY total DESC
    `);

    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('                    TOP 10 USERS BY LOYALTY POINTS                            ');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

    topPointsRes.rows.forEach((user, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${user.firstName} ${user.lastName}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Tier: ${user.loyaltyTier.toUpperCase()} | Points: ${user.loyaltyPoints.toLocaleString()} | Status: ${user.isActive ? '✅ Active' : '❌ Inactive'}`);
      console.log();
    });

    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('                    TOP 10 MOST ACTIVE USERS                                  ');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

    activeRes.rows.forEach((user, index) => {
      const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never';
      console.log(`${(index + 1).toString().padStart(2)}. ${user.firstName} ${user.lastName}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Tier: ${user.loyaltyTier.toUpperCase()} | Last Login: ${lastLogin}`);
      console.log();
    });

    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('                    LOYALTY TIER BREAKDOWN                                    ');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

    tierRes.rows.forEach(tier => {
      const tierName = (tier.loyaltyTier || tier.loyaltytier || 'UNKNOWN').toUpperCase();
      const total = tier.total;
      const members = tier.members;
      const avgPoints = Math.round(tier.avg_points);
      const memberPercentage = ((members / total) * 100).toFixed(1);

      console.log(`${tierName} Tier:`);
      console.log(`  Total Users:        ${total}`);
      console.log(`  Loyalty Members:    ${members} (${memberPercentage}%)`);
      console.log(`  Avg Points:         ${avgPoints.toLocaleString()}`);
      console.log();
    });

    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

    await client.end();
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

getUserRankings();

