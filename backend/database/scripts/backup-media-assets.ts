import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables from the gateway service .env file
config({ path: path.join(__dirname, '../../services/gateway/.env') });

/**
 * Backup script to extract all media/image data from current database
 * before dropping tables for schema rebuild.
 * 
 * This preserves:
 * - Splash screen images
 * - Carousel images
 * - Menu item images
 * - Promotion images
 */

interface MediaBackup {
  splashScreens: Array<{
    id: string;
    title: string;
    description: string | null;
    imageUrl: string;
    imageSizeBytes: number | null;
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
    description: string | null;
    imageUrl: string;
    imageSizeBytes: number | null;
    imageWidth: number | null;
    imageHeight: number | null;
    position: number;
    isActive: boolean;
    targetMenuItemId: string | null;
    startDate: Date | null;
    endDate: Date | null;
    displayDuration: number;
    createdBy: string | null;
    notes: string | null;
    createdAt: Date;
  }>;
  menuItems: Array<{
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    category: string;
    basePrice: number;
    storeIds: string[];
  }>;
  promotions: Array<{
    id: string;
    title: string;
    description: string | null;
    imageUrl: string;
    promotionType: string;
    targetMenuItemId: string | null;
    targetUrl: string | null;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
  }>;
  backupDate: Date;
}

async function backupMediaAssets() {
  console.log('🔍 Environment check:');
  console.log(`   DB_HOST: ${process.env.DB_HOST}`);
  console.log(`   DB_DATABASE: ${process.env.DB_DATABASE}`);
  console.log(`   Password loaded: ${process.env.DB_PASSWORD ? 'Yes' : 'No'}`);

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

    const backup: MediaBackup = {
      splashScreens: [],
      carouselImages: [],
      menuItems: [],
      promotions: [],
      backupDate: new Date(),
    };

    // Backup splash screens
    console.log('📸 Backing up splash screens...');
    const splashScreens = await dataSource.query(`
      SELECT id, title, description, image_url as "imageUrl", image_size_bytes as "imageSizeBytes",
             display_duration as "displayDuration", start_date as "startDate", end_date as "endDate",
             is_active as "isActive", target_menu_item_id as "targetMenuItemId", target_url as "targetUrl",
             notes, created_at as "createdAt", created_by_id as "createdById",
             replaced_at as "replacedAt", replaced_by_id as "replacedById"
      FROM splash_screens
    `);
    backup.splashScreens = splashScreens;
    console.log(`✅ Backed up ${splashScreens.length} splash screens`);

    // Backup carousel images
    console.log('🎠 Backing up carousel images...');
    const carouselImages = await dataSource.query(`
      SELECT id, title, description, image_url as "imageUrl", image_size_bytes as "imageSizeBytes",
             image_width as "imageWidth", image_height as "imageHeight", position, is_active as "isActive",
             target_menu_item_id as "targetMenuItemId", start_date as "startDate", end_date as "endDate",
             display_duration as "displayDuration", created_by as "createdBy", notes, created_at as "createdAt"
      FROM carousel_images
    `);
    backup.carouselImages = carouselImages;
    console.log(`✅ Backed up ${carouselImages.length} carousel images`);

    // Backup menu items with images
    console.log('🍰 Backing up menu items...');
    const menuItems = await dataSource.query(`
      SELECT id, name, description, "imageUrl", category, "basePrice", "storeIds"
      FROM menu_items
      WHERE "imageUrl" IS NOT NULL
    `);
    backup.menuItems = menuItems;
    console.log(`✅ Backed up ${menuItems.length} menu items with images`);

    // Backup promotions
    console.log('🎉 Backing up promotions...');
    const promotions = await dataSource.query(`
      SELECT id, title, description, image_url as "imageUrl", promotion_type as "promotionType",
             target_menu_item_id as "targetMenuItemId", target_url as "targetUrl",
             start_date as "startDate", end_date as "endDate", is_active as "isActive"
      FROM promotions
    `);
    backup.promotions = promotions;
    console.log(`✅ Backed up ${promotions.length} promotions`);

    // Save backup to file
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `media-backup-${timestamp}.json`);

    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    console.log(`\n✅ Backup completed successfully!`);
    console.log(`📁 Backup file: ${backupFile}`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Splash Screens: ${backup.splashScreens.length}`);
    console.log(`   - Carousel Images: ${backup.carouselImages.length}`);
    console.log(`   - Menu Items: ${backup.menuItems.length}`);
    console.log(`   - Promotions: ${backup.promotions.length}`);

    await dataSource.destroy();
    return backupFile;
  } catch (error) {
    console.error('❌ Error backing up media assets:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  backupMediaAssets()
    .then(() => {
      console.log('\n✅ Backup script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Backup script failed:', error);
      process.exit(1);
    });
}

export { backupMediaAssets, MediaBackup };

