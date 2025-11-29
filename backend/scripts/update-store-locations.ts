import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../services/gateway/.env') });

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function updateStoreLocations() {
  try {
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to database');

    console.log('📝 Updating store location data...');
    
    // Update the existing "Only Coffee - Habana Outpost" store
    const result = await dataSource.query(`
      UPDATE stores 
      SET 
        city = 'New Orleans',
        state = 'Louisiana',
        zip_code = '70116',
        country = 'United States',
        country_code = 'US',
        continent = 'North America'
      WHERE name LIKE '%Habana Outpost%'
      RETURNING store_id, name, city, state, zip_code, country;
    `);

    if (result.length > 0) {
      console.log('✅ Updated store:');
      console.log(`   Name: ${result[0].name}`);
      console.log(`   City: ${result[0].city}`);
      console.log(`   State: ${result[0].state}`);
      console.log(`   ZIP: ${result[0].zip_code}`);
      console.log(`   Country: ${result[0].country}`);
    } else {
      console.log('⚠️  No stores found to update');
    }

    console.log('🎉 Update completed successfully!');
    
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Update failed:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

updateStoreLocations();

