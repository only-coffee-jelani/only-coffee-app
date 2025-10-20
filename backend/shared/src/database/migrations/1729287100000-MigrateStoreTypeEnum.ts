import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateStoreTypeEnum1729287100000 implements MigrationInterface {
  name = 'MigrateStoreTypeEnum1729287100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, update the data to use the new enum values
    // Map old values to new values
    await queryRunner.query(`
      UPDATE "stores" SET "type" = 'coffee_shop' WHERE "type" = 'store'
    `);

    await queryRunner.query(`
      UPDATE "stores" SET "type" = 'mobile_coffee_bar' WHERE "type" IN ('truck', 'kiosk')
    `);

    // Drop the default constraint first
    await queryRunner.query(`
      ALTER TABLE "stores" ALTER COLUMN "type" DROP DEFAULT
    `);

    // Now drop the old enum and create the new one
    await queryRunner.query(`
      ALTER TYPE "public"."stores_type_enum" RENAME TO "stores_type_enum_old"
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."stores_type_enum" AS ENUM('coffee_shop', 'mobile_coffee_bar')
    `);

    // Alter the column to use the new enum
    await queryRunner.query(`
      ALTER TABLE "stores" ALTER COLUMN "type" TYPE "public"."stores_type_enum" USING "type"::"text"::"public"."stores_type_enum"
    `);

    // Set the new default
    await queryRunner.query(`
      ALTER TABLE "stores" ALTER COLUMN "type" SET DEFAULT 'coffee_shop'
    `);

    // Drop the old enum
    await queryRunner.query(`
      DROP TYPE "public"."stores_type_enum_old"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to old enum
    await queryRunner.query(`
      ALTER TYPE "public"."stores_type_enum" RENAME TO "stores_type_enum_new"
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."stores_type_enum" AS ENUM('store', 'truck', 'kiosk')
    `);

    await queryRunner.query(`
      ALTER TABLE "stores" ALTER COLUMN "type" TYPE "public"."stores_type_enum" USING 
      CASE 
        WHEN "type"::text = 'coffee_shop' THEN 'store'::text
        WHEN "type"::text = 'mobile_coffee_bar' THEN 'truck'::text
        ELSE 'store'::text
      END::"public"."stores_type_enum"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."stores_type_enum_new"
    `);
  }
}

