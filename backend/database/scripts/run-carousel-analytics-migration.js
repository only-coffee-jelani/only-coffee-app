/**
 * Script to run carousel analytics tables migration
 * 
 * This script directly executes the SQL to create carousel analytics tables
 * without going through TypeORM migrations (which have issues with existing tables).
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST || 'only-coffee-db.cu96ksosqdq2.us-east-1.rds.amazonaws.com',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'Dieb4utr1I!',
    database: process.env.DB_DATABASE || 'only_coffee',
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    console.log('📖 Reading SQL file...');
    const sqlPath = path.join(__dirname, '../sql/carousel-analytics-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('✅ SQL file loaded');

    console.log('🚀 Executing SQL...');
    await client.query(sql);
    console.log('✅ SQL executed successfully');

    console.log('\n🎉 Carousel analytics tables created successfully!');
    console.log('✅ carousel_events - Raw event tracking');
    console.log('✅ carousel_sessions - Session engagement tracking');
    console.log('✅ carousel_daily_aggregates - Pre-computed daily metrics');
    console.log('✅ carousel_ab_tests - A/B testing framework');
    console.log('✅ carousel_position_performance - Position-based analytics');

  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

runMigration();

