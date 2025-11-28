import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../services/gateway/.env') });

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function seedStores() {
  console.log('\n🏪 ========================================');
  console.log('   SEEDING STORES');
  console.log('========================================\n');

  try {
    await dataSource.initialize();
    console.log('✅ Connected to database\n');

    // Get store type IDs
    const storeTypes = await dataSource.query(`
      SELECT store_type_id, code FROM store_types
    `);
    
    const storeTypeMap = storeTypes.reduce((acc: any, st: any) => {
      acc[st.code] = st.store_type_id;
      return acc;
    }, {});

    console.log('📋 Found store types:', Object.keys(storeTypeMap).join(', '));

    // Check if stores already exist
    const existingStores = await dataSource.query(`SELECT COUNT(*) as count FROM stores`);
    if (parseInt(existingStores[0].count) > 0) {
      console.log(`⚠️  Found ${existingStores[0].count} existing stores`);
      console.log('🗑️  Clearing existing stores...');
      await dataSource.query(`DELETE FROM stores`);
      console.log('✅ Cleared existing stores\n');
    }

    // Seed stores
    const stores = [
      {
        name: 'Only Coffee - Downtown',
        store_type_id: storeTypeMap['flagship'] || storeTypeMap['standard'],
        address: '123 Main Street, Seattle, WA 98101',
        latitude: 47.6062,
        longitude: -122.3321,
        phone: '(206) 555-0101',
        toast_location_id: 'toast_downtown_001',
        is_active: true,
        opened_at: '2023-01-15T08:00:00Z'
      },
      {
        name: 'Only Coffee - Capitol Hill',
        store_type_id: storeTypeMap['standard'],
        address: '456 Broadway Ave, Seattle, WA 98102',
        latitude: 47.6205,
        longitude: -122.3212,
        phone: '(206) 555-0102',
        toast_location_id: 'toast_capitol_002',
        is_active: true,
        opened_at: '2023-03-20T08:00:00Z'
      },
      {
        name: 'Only Coffee - University District',
        store_type_id: storeTypeMap['standard'],
        address: '789 University Way NE, Seattle, WA 98105',
        latitude: 47.6553,
        longitude: -122.3035,
        phone: '(206) 555-0103',
        toast_location_id: 'toast_udistrict_003',
        is_active: true,
        opened_at: '2023-06-10T08:00:00Z'
      },
      {
        name: 'Only Coffee - Bellevue',
        store_type_id: storeTypeMap['standard'],
        address: '321 Bellevue Way NE, Bellevue, WA 98004',
        latitude: 47.6101,
        longitude: -122.2015,
        phone: '(425) 555-0104',
        toast_location_id: 'toast_bellevue_004',
        is_active: true,
        opened_at: '2023-09-05T08:00:00Z'
      }
    ];

    console.log(`📝 Inserting ${stores.length} stores...\n`);

    const insertedStores = [];
    for (const store of stores) {
      const result = await dataSource.query(`
        INSERT INTO stores (
          name, store_type_id, address, latitude, longitude, 
          phone, toast_location_id, is_active, opened_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING store_id, name
      `, [
        store.name,
        store.store_type_id,
        store.address,
        store.latitude,
        store.longitude,
        store.phone,
        store.toast_location_id,
        store.is_active,
        store.opened_at
      ]);
      
      insertedStores.push(result[0]);
      console.log(`   ✅ ${result[0].name} (${result[0].store_id})`);
    }

    console.log(`\n✅ Successfully seeded ${insertedStores.length} stores!\n`);

    // Add store hours for all stores (Mon-Sun, 6 AM - 8 PM)
    console.log('⏰ Adding store hours...\n');
    
    for (const store of insertedStores) {
      for (let day = 0; day <= 6; day++) {
        await dataSource.query(`
          INSERT INTO store_hours (store_id, day_of_week, open_time, close_time)
          VALUES ($1, $2, $3, $4)
        `, [store.store_id, day, '06:00:00', '20:00:00']);
      }
      console.log(`   ✅ Added hours for ${store.name}`);
    }

    console.log('\n✅ Store hours added successfully!\n');
    console.log('========================================');
    console.log('   STORE SEEDING COMPLETE!');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error seeding stores:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

seedStores();

