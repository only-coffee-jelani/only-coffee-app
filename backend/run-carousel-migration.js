#!/usr/bin/env node

const { DataSource } = require('typeorm');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'services/gateway/.env') });

async function runMigration() {
  console.log('🚀 Starting carousel migration...');
  console.log('📍 Database Host:', process.env.DB_HOST);
  console.log('📍 Database Name:', process.env.DB_DATABASE);
  console.log('📍 Database User:', process.env.DB_USERNAME);

  const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [path.join(__dirname, 'shared/dist/database/entities/**/*.entity.js')],
    migrations: [path.join(__dirname, 'shared/dist/database/migrations/**/*.js')],
    synchronize: false,
    logging: true,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    console.log('🔄 Running migrations...');
    await AppDataSource.runMigrations();
    console.log('✅ Migrations completed successfully!');

    await AppDataSource.destroy();
    console.log('✅ Connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();

