import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables from the gateway service .env file
config({ path: path.join(__dirname, '../../services/gateway/.env') });

/**
 * Data migration script to migrate media assets from backup to new schema
 * 
 * This script:
 * 1. Reads the backup JSON file created by backup-media-assets.ts
 * 2. Inserts unique image URLs into the new media_assets table
 * 3. Migrates splash screens with references to media_assets
 * 4. Migrates carousel images with references to media_assets
 * 5. Migrates menu items with references to media_assets
 * 6. Migrates promotions (if they have images)
 */

interface MediaBackup {
  splashScreens: Array<{
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    imageSizeBytes: number;
    displayDuration: number;
    startDate: Date | null;
    endDate: Date | null;
    isActive: boolean;
    targetMenuItemId: string | null;
    targetUrl: string | null;
    notes: string | null;
    createdAt: Date;
    createdById: string | null;
    replacedAt: Date | null;
    replacedById: string | null;
  }>;
  carouselImages: Array<{
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    imageSizeBytes: number;
    imageWidth: number;
    imageHeight: number;
    position: number;
    targetUrl: string | null;
    isActive: boolean;
    startDate: Date | null;
    endDate: Date | null;
    createdAt: Date;
  }>;
  menuItems: Array<{
    id: string;
    name: string;
    description: string;
    imageUrl: string | null;
    basePrice: number;
    category: string;
    storeIds: string[];
    isActive: boolean;
    createdAt: Date;
  }>;
  promotions: Array<{
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    promotionType: string;
    discountValue: number;
    startDate: Date | null;
    endDate: Date | null;
    isActive: boolean;
    createdAt: Date;
  }>;
  backupDate: Date;
}

async function migrateMediaAssets() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'only_coffee',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to database');

    // Find the most recent backup file
    const backupsDir = path.join(__dirname, '../backups');
    const files = fs.readdirSync(backupsDir).filter(f => f.startsWith('media-backup-') && f.endsWith('.json'));
    
    if (files.length === 0) {
      throw new Error('No backup file found. Please run backup-media-assets.ts first.');
    }

    const latestBackup = files.sort().reverse()[0];
    const backupPath = path.join(backupsDir, latestBackup);
    
    console.log(`📂 Reading backup file: ${latestBackup}`);
    const backup: MediaBackup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

    // Track URL to asset_id mapping
    const urlToAssetId = new Map<string, string>();

    // ============================================
    // 1. Insert all unique image URLs into media_assets
    // ============================================
    console.log('\n🖼️  Migrating media assets...');
    
    const allImageUrls = new Set<string>();
    
    // Collect all unique URLs
    backup.splashScreens.forEach(s => allImageUrls.add(s.imageUrl));
    backup.carouselImages.forEach(c => allImageUrls.add(c.imageUrl));
    backup.menuItems.forEach(m => m.imageUrl && allImageUrls.add(m.imageUrl));
    backup.promotions.forEach(p => p.imageUrl && allImageUrls.add(p.imageUrl));

    console.log(`   Found ${allImageUrls.size} unique image URLs`);

    // Insert each unique URL
    for (const url of allImageUrls) {
      const result = await dataSource.query(
        `INSERT INTO media_assets (url, type, created_at, updated_at)
         VALUES ($1, 'image', NOW(), NOW())
         RETURNING asset_id`,
        [url]
      );
      urlToAssetId.set(url, result[0].asset_id);
    }

    console.log(`   ✅ Inserted ${urlToAssetId.size} media assets`);

    // ============================================
    // 2. Migrate splash screens
    // ============================================
    console.log('\n🖼️  Migrating splash screens...');

    for (const splash of backup.splashScreens) {
      const assetId = urlToAssetId.get(splash.imageUrl);

      await dataSource.query(
        `INSERT INTO splash_screens (
          splash_id, title, subtitle, image_asset_id, duration_seconds,
          start_at, end_at, is_active, deeplink, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          splash.id,
          splash.title,
          splash.description, // subtitle
          assetId,
          splash.displayDuration,
          splash.startDate,
          splash.endDate,
          splash.isActive,
          splash.targetUrl, // deeplink
          splash.createdAt,
          new Date(),
        ]
      );
    }

    console.log(`   ✅ Migrated ${backup.splashScreens.length} splash screens`);

    // ============================================
    // 3. Migrate carousel images
    // ============================================
    console.log('\n🎠 Migrating carousel images...');

    // First, create a default carousel
    const carouselResult = await dataSource.query(
      `INSERT INTO carousels (name, placement, is_active, created_at, updated_at)
       VALUES ('Home Carousel', 'home', true, NOW(), NOW())
       RETURNING carousel_id`
    );
    const carouselId = carouselResult[0].carousel_id;

    for (const carousel of backup.carouselImages) {
      const assetId = urlToAssetId.get(carousel.imageUrl);

      await dataSource.query(
        `INSERT INTO carousel_items (
          carousel_item_id, carousel_id, image_asset_id, title, subtitle,
          deeplink, sort_order, start_at, end_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          carousel.id,
          carouselId,
          assetId,
          carousel.title,
          carousel.description, // subtitle
          carousel.targetUrl, // deeplink
          carousel.position, // sort_order
          carousel.startDate,
          carousel.endDate,
          carousel.createdAt,
          new Date(),
        ]
      );
    }

    console.log(`   ✅ Migrated ${backup.carouselImages.length} carousel items`);

    // ============================================
    // 4. Migrate menu items
    // ============================================
    console.log('\n🍰 Migrating menu items...');

    // First, create categories from unique category names
    const categoryMap = new Map<string, string>();
    const uniqueCategories = [...new Set(backup.menuItems.map(m => m.category))];

    for (const categoryName of uniqueCategories) {
      const result = await dataSource.query(
        `INSERT INTO menu_categories (name, created_at, updated_at)
         VALUES ($1, NOW(), NOW())
         RETURNING category_id`,
        [categoryName]
      );
      categoryMap.set(categoryName, result[0].category_id);
    }

    console.log(`   Created ${categoryMap.size} menu categories`);

    for (const item of backup.menuItems) {
      const assetId = item.imageUrl ? urlToAssetId.get(item.imageUrl) : null;
      const categoryId = categoryMap.get(item.category);

      await dataSource.query(
        `INSERT INTO menu_items (
          menu_item_id, category_id, name, description, base_price,
          image_asset_id, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [
          item.id,
          categoryId,
          item.name,
          item.description,
          item.basePrice,
          assetId,
          true, // Default to active
        ]
      );
    }

    console.log(`   ✅ Migrated ${backup.menuItems.length} menu items`);

    // ============================================
    // 5. Migrate promotions (if applicable)
    // ============================================
    console.log('\n💰 Migrating promotions...');

    // Get the 'percent' discount type ID
    const discountTypeResult = await dataSource.query(
      `SELECT promotion_discount_type_id FROM promotion_discount_types WHERE code = 'percent' LIMIT 1`
    );
    const discountTypeId = discountTypeResult[0]?.promotion_discount_type_id;

    if (discountTypeId) {
      for (const promo of backup.promotions) {
        await dataSource.query(
          `INSERT INTO promotions (
            promotion_id, name, description, promotion_discount_type_id,
            discount_value, start_date, end_date, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            promo.id,
            promo.name,
            promo.description,
            discountTypeId,
            promo.discountValue,
            promo.startDate,
            promo.endDate,
            promo.createdAt,
            new Date(),
          ]
        );
      }

      console.log(`   ✅ Migrated ${backup.promotions.length} promotions`);
    } else {
      console.log(`   ⚠️  Skipped promotions (discount type not found)`);
    }

    console.log('\n✅ All media assets migrated successfully!');
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error migrating media assets:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  migrateMediaAssets()
    .then(() => {
      console.log('\n✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateMediaAssets };


