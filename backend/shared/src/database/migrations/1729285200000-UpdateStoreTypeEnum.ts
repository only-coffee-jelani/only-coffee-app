import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateStoreTypeEnum1729285200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new enum values to stores_type_enum
    await queryRunner.query(`
      ALTER TYPE stores_type_enum ADD VALUE 'coffee_shop' BEFORE 'store'
    `);
    
    await queryRunner.query(`
      ALTER TYPE stores_type_enum ADD VALUE 'mobile_coffee_bar' AFTER 'coffee_shop'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values, so we can't fully revert this
    // The old enum values (store, truck, kiosk) will remain in the database
  }
}

