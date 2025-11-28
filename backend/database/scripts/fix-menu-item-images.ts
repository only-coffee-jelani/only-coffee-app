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

async function fixMenuItemImages() {
  console.log('\n🖼️  ========================================');
  console.log('   FIXING MENU ITEM IMAGE REFERENCES');
  console.log('========================================\n');

  try {
    await dataSource.initialize();
    console.log('✅ Connected to database\n');

    // Get all media assets
    console.log('📋 Fetching media assets...');
    const mediaAssets = await dataSource.query(`
      SELECT asset_id, url, alt_text, type FROM media_assets
    `);
    
    console.log(`   Found ${mediaAssets.length} media assets\n`);
    
    // Get all menu items
    console.log('📋 Fetching menu items...');
    const menuItems = await dataSource.query(`
      SELECT menu_item_id, name, image_asset_id FROM menu_items
    `);
    
    console.log(`   Found ${menuItems.length} menu items\n`);

    // Map menu items to their images based on URL patterns
    const imageMapping: Record<string, string> = {};
    
    for (const asset of mediaAssets) {
      const url = asset.url.toLowerCase();
      
      // Match Waffolino images
      if (url.includes('waffolino')) {
        if (url.includes('affogato')) {
          imageMapping['Waffolino Affogato'] = asset.asset_id;
        } else {
          imageMapping['Waffolino'] = asset.asset_id;
        }
      }
      
      // Match King Kong Cold Brew
      if (url.includes('king-kong') || url.includes('kingkong')) {
        imageMapping['King Kong Cold Brew (Large)'] = asset.asset_id;
      }
    }

    console.log('🔗 Image mapping:');
    for (const [itemName, assetId] of Object.entries(imageMapping)) {
      console.log(`   ${itemName} → ${assetId}`);
    }
    console.log();

    // Update menu items with their image references
    console.log('🔄 Updating menu item image references...\n');
    
    let updatedCount = 0;
    for (const item of menuItems) {
      const assetId = imageMapping[item.name];
      
      if (assetId) {
        await dataSource.query(`
          UPDATE menu_items 
          SET image_asset_id = $1, updated_at = NOW()
          WHERE menu_item_id = $2
        `, [assetId, item.menu_item_id]);
        
        console.log(`   ✅ ${item.name} → linked to image`);
        updatedCount++;
      } else {
        console.log(`   ⚠️  ${item.name} → no matching image found`);
      }
    }

    console.log(`\n✅ Updated ${updatedCount} out of ${menuItems.length} menu items\n`);

    // Verify the updates
    console.log('🔍 Verifying updates...\n');
    const verifyResults = await dataSource.query(`
      SELECT 
        mi.name,
        mi.image_asset_id,
        ma.url as image_url
      FROM menu_items mi
      LEFT JOIN media_assets ma ON mi.image_asset_id = ma.asset_id
      ORDER BY mi.name
    `);

    console.log('📊 Menu Items with Images:');
    for (const result of verifyResults) {
      const status = result.image_asset_id ? '✅' : '❌';
      const imageInfo = result.image_url ? `(${result.image_url.substring(0, 60)}...)` : '(no image)';
      console.log(`   ${status} ${result.name} ${imageInfo}`);
    }

    console.log('\n========================================');
    console.log('   IMAGE REFERENCE FIX COMPLETE!');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error fixing menu item images:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

fixMenuItemImages();

