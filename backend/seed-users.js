const pg = require('pg');
const crypto = require('crypto');

// Sample data for diverse users
const firstNames = ['John', 'Sarah', 'Michael', 'Emma', 'David', 'Jessica', 'James', 'Lisa', 'Robert', 'Maria', 'William', 'Jennifer', 'Richard', 'Patricia', 'Joseph', 'Linda', 'Thomas', 'Barbara', 'Charles', 'Susan', 'Christopher', 'Karen', 'Daniel'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson'];
const loyaltyTiers = ['silver', 'gold', 'platinum'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];

function generateEmail(firstName, lastName, index) {
  const timestamp = Date.now();
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}.${timestamp}@onlycoffee.com`;
}

function generatePhone() {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const exchange = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `+1${areaCode}${exchange}${number}`;
}

function generateBirthDate() {
  const year = Math.floor(Math.random() * 40) + 1960; // 1960-2000
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function getRandomTier() {
  return loyaltyTiers[Math.floor(Math.random() * loyaltyTiers.length)];
}

function getRandomLoyaltyPoints() {
  return Math.floor(Math.random() * 5000) + 100; // 100-5100 points
}

function getRandomBoolean(probability = 0.5) {
  return Math.random() < probability;
}

async function seedUsers() {
  console.log('🌱 Seeding 23 new users into the database...\n');

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

    const users = [];
    
    // Generate 23 unique users
    for (let i = 0; i < 23; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i];
      const email = generateEmail(firstName, lastName, i + 1);
      const phone = generatePhone();
      const birthDate = generateBirthDate();
      const loyaltyTier = getRandomTier();
      const loyaltyPoints = getRandomLoyaltyPoints();
      const isActive = getRandomBoolean(0.85); // 85% active
      const isLoyaltyMember = getRandomBoolean(0.7); // 70% loyalty members
      const emailVerified = getRandomBoolean(0.8); // 80% verified
      const phoneVerified = getRandomBoolean(0.6); // 60% verified
      const marketingOptIn = getRandomBoolean(0.65); // 65% opted in
      const passwordHash = hashPassword(`password${i + 1}`);
      
      // Random dates in the past
      const createdDaysAgo = Math.floor(Math.random() * 90) + 1; // 1-90 days ago
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - createdDaysAgo);
      
      const lastLoginDaysAgo = isActive ? Math.floor(Math.random() * 30) : Math.floor(Math.random() * 90) + 30;
      const lastLoginAt = new Date();
      lastLoginAt.setDate(lastLoginAt.getDate() - lastLoginDaysAgo);
      
      const lastActivityDaysAgo = isActive ? Math.floor(Math.random() * 7) : Math.floor(Math.random() * 60) + 30;
      const lastActivityDate = new Date();
      lastActivityDate.setDate(lastActivityDate.getDate() - lastActivityDaysAgo);

      users.push({
        id: crypto.randomUUID(),
        email,
        firstName,
        lastName,
        phone,
        birthDate,
        passwordHash,
        loyaltyTier,
        loyaltyPoints,
        isActive,
        isLoyaltyMember,
        emailVerified,
        phoneVerified,
        marketingOptIn,
        createdAt,
        lastLoginAt: isActive ? lastLoginAt : null,
        lastActivityDate: isActive ? lastActivityDate : null,
        role: 'customer',
        profileCompleted: true,
        notificationsEnabled: getRandomBoolean(0.7)
      });
    }

    // Insert users into database
    let insertedCount = 0;
    for (const user of users) {
      await client.query(
        `INSERT INTO users (
          id, email, "firstName", "lastName", phone, "birthDate", "passwordHash",
          "loyaltyTier", "loyaltyPoints", "isActive", "isLoyaltyMember",
          "emailVerified", "phoneVerified", "marketingOptIn", role, "profileCompleted",
          "notificationsEnabled", "createdAt", "lastLoginAt", "lastActivityDate"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
        [
          user.id, user.email, user.firstName, user.lastName, user.phone, user.birthDate,
          user.passwordHash, user.loyaltyTier, user.loyaltyPoints, user.isActive,
          user.isLoyaltyMember, user.emailVerified, user.phoneVerified, user.marketingOptIn,
          user.role, user.profileCompleted, user.notificationsEnabled, user.createdAt,
          user.lastLoginAt, user.lastActivityDate
        ]
      );
      insertedCount++;
      console.log(`✓ Created user ${insertedCount}/23: ${user.firstName} ${user.lastName} (${user.email})`);
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('                    SEEDING COMPLETE                        ');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Get updated statistics
    const statsRes = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN "isActive" = true THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN "isLoyaltyMember" = true THEN 1 ELSE 0 END) as loyalty_members,
        "loyaltyTier",
        COUNT(*) as tier_count
      FROM users
      GROUP BY "loyaltyTier"
      ORDER BY tier_count DESC
    `);

    const totalRes = await client.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = totalRes.rows[0].count;

    console.log(`📊 Total Users Now:         ${totalUsers}`);
    console.log(`👥 Active Users:            ${statsRes.rows[0].active_users}`);
    console.log(`🏆 Loyalty Members:         ${statsRes.rows[0].loyalty_members}\n`);

    console.log('Breakdown by Loyalty Tier:');
    console.log('─────────────────────────────────────────────────────────────');
    
    const tierStats = await client.query(`
      SELECT "loyaltyTier", COUNT(*) as count 
      FROM users 
      GROUP BY "loyaltyTier" 
      ORDER BY count DESC
    `);

    tierStats.rows.forEach(row => {
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

seedUsers();

