const pg = require('pg');

async function getUsers() {
  console.log('Fetching all users from the database...\n');

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

    // Get all users with relevant information
    const res = await client.query(`
      SELECT 
        id,
        email,
        "firstName",
        "lastName",
        phone,
        "loyaltyTier",
        "loyaltyPoints",
        "isActive",
        "isLoyaltyMember",
        "emailVerified",
        "phoneVerified",
        "marketingOptIn",
        "createdAt",
        "lastLoginAt",
        "lastActivityDate"
      FROM users
      ORDER BY "createdAt" DESC
    `);

    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('                              ALL USERS IN DATABASE                            ');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

    res.rows.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log('─────────────────────────────────────────────────────────────────────────────');
      console.log(`  ID:                  ${user.id}`);
      console.log(`  Email:               ${user.email}`);
      console.log(`  Name:                ${user.firstName} ${user.lastName}`);
      console.log(`  Phone:               ${user.phone || 'N/A'}`);
      console.log(`  Loyalty Tier:        ${user.loyaltyTier}`);
      console.log(`  Loyalty Points:      ${user.loyaltyPoints}`);
      console.log(`  Active:              ${user.isActive ? 'Yes' : 'No'}`);
      console.log(`  Loyalty Member:      ${user.isLoyaltyMember ? 'Yes' : 'No'}`);
      console.log(`  Email Verified:      ${user.emailVerified ? 'Yes' : 'No'}`);
      console.log(`  Phone Verified:      ${user.phoneVerified ? 'Yes' : 'No'}`);
      console.log(`  Marketing Opt-In:    ${user.marketingOptIn ? 'Yes' : 'No'}`);
      console.log(`  Created:             ${new Date(user.createdAt).toLocaleString()}`);
      console.log(`  Last Login:          ${user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}`);
      console.log(`  Last Activity:       ${user.lastActivityDate ? new Date(user.lastActivityDate).toLocaleString() : 'Never'}`);
      console.log();
    });

    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

    await client.end();
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

getUsers();

