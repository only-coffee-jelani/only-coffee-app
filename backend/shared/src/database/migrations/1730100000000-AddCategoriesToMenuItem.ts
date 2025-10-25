import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoriesToMenuItem1730100000000 implements MigrationInterface {
  name = 'AddCategoriesToMenuItem1730100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add categories column as array of enums
    await queryRunner.query(`
      ALTER TABLE menu_items
      ADD COLUMN IF NOT EXISTS categories menu_category_enum[] DEFAULT ARRAY[]::menu_category_enum[];
    `);

    // Migrate existing category data to categories array
    // This copies the single category value into the categories array
    await queryRunner.query(`
      UPDATE menu_items
      SET categories = ARRAY[category]::menu_category_enum[]
      WHERE categories = ARRAY[]::menu_category_enum[];
    `);

    // Add index on categories for performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_menu_items_categories
      ON menu_items USING GIN (categories);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove index
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_menu_items_categories;
    `);

    // Remove categories column
    await queryRunner.query(`
      ALTER TABLE menu_items DROP COLUMN IF EXISTS categories;
    `);
  }
}
