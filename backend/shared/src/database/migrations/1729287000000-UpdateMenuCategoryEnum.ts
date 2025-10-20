import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMenuCategoryEnum1729287000000 implements MigrationInterface {
  name = 'UpdateMenuCategoryEnum1729287000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create new enum type with the new values
    await queryRunner.query(`
      CREATE TYPE menu_category_enum AS ENUM (
        'hot_coffee',
        'iced_coffee',
        'cold_brew',
        'signature',
        'seasonal_specials',
        'chocolate',
        'ice_cream',
        'add_ons'
      )
    `);

    // Alter the column to use the new enum type
    await queryRunner.query(`
      ALTER TABLE "menu_items"
      ALTER COLUMN "category" TYPE menu_category_enum USING "category"::text::menu_category_enum
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Alter the column back to varchar
    await queryRunner.query(`
      ALTER TABLE "menu_items"
      ALTER COLUMN "category" TYPE varchar(50)
    `);

    // Drop the enum type
    await queryRunner.query(`
      DROP TYPE menu_category_enum
    `);
  }
}

