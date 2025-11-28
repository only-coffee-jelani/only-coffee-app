import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

/**
 * Migration: Add is_active column to carousel_items table
 * 
 * Purpose: Enable granular activation/deactivation control at the carousel item level
 * in addition to the existing carousel-level activation control.
 * 
 * Enterprise Features:
 * - Default value of TRUE for backward compatibility
 * - NOT NULL constraint for data integrity
 * - Composite index on (carousel_id, is_active, sort_order) for optimal query performance
 * - Proper rollback support
 * 
 * Business Logic:
 * An item is visible if:
 * - carousel.is_active = true (parent level)
 * - item.is_active = true (item level)
 * - item.start_at <= now OR item.start_at IS NULL
 * - item.end_at >= now OR item.end_at IS NULL
 */
export class AddIsActiveToCarouselItems1732700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add is_active column with default TRUE
    await queryRunner.addColumn(
      'carousel_items',
      new TableColumn({
        name: 'is_active',
        type: 'boolean',
        default: true,
        isNullable: false,
        comment: 'Whether this carousel item is active. Must be true along with carousel.is_active for item to display.',
      }),
    );

    // Create composite index for optimal query performance
    // This index supports queries filtering by carousel_id, is_active, and ordering by sort_order
    await queryRunner.createIndex(
      'carousel_items',
      new TableIndex({
        name: 'IDX_carousel_items_carousel_active_sort',
        columnNames: ['carousel_id', 'is_active', 'sort_order'],
      }),
    );

    // Set all existing items to active (backward compatibility)
    await queryRunner.query(`
      UPDATE carousel_items 
      SET is_active = true 
      WHERE is_active IS NULL
    `);

    console.log('✅ Added is_active column to carousel_items table');
    console.log('✅ Created composite index IDX_carousel_items_carousel_active_sort');
    console.log('✅ Set all existing carousel items to active');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the index first
    await queryRunner.dropIndex('carousel_items', 'IDX_carousel_items_carousel_active_sort');

    // Drop the column
    await queryRunner.dropColumn('carousel_items', 'is_active');

    console.log('✅ Rolled back: Removed is_active column and index from carousel_items');
  }
}

