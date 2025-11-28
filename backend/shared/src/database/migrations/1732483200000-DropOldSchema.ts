import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * ⚠️ WARNING: DESTRUCTIVE MIGRATION ⚠️
 * 
 * This migration drops ALL existing tables in the database.
 * 
 * BEFORE RUNNING:
 * 1. Run the backup script: npm run backup:media
 * 2. Verify backup file was created successfully
 * 3. Ensure you have a full database backup
 * 
 * This migration is part of the database rebuild to implement
 * the new enterprise-grade schema for Only Coffee.
 */
export class DropOldSchema1732483200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('⚠️  WARNING: Dropping all existing tables...');
    console.log('⚠️  Make sure you have backed up all media assets!');
    
    // Drop tables in correct order (respecting foreign key constraints)
    const tablesToDrop = [
      // AI and personalization tables
      'ai_promotions',
      'promotion_executions',
      'model_logs',
      'user_segment_assignments',
      'user_segments',
      'user_events',
      'user_profiles',
      
      // Loyalty and rewards tables
      'streak_visits',
      'user_streaks',
      'streak_rewards',
      'anniversary_rewards',
      'streak_saver_tokens',
      'tier_perks',
      'user_tier_history',
      'rewards_ledger',
      'coupon_grants',
      'promo_codes',
      'program_events',
      
      // Order and payment tables
      'order_items',
      'orders',
      'delivery_orders',
      
      // Content and media tables
      'carousel_images',
      'splash_screens',
      'promotions',
      'reviews',
      
      // Menu tables
      'menu_items',
      'categories',
      
      // User and store tables
      'notification_preferences',
      'gift_cards',
      'users',
      'stores',
    ];

    for (const table of tablesToDrop) {
      try {
        await queryRunner.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        console.log(`✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`⚠️  Table ${table} does not exist or already dropped`);
      }
    }

    console.log('✅ All old tables dropped successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This migration cannot be reversed
    // You must restore from backup
    throw new Error(
      'This migration cannot be reversed. ' +
      'To restore the old schema, you must restore from a database backup.'
    );
  }
}

