import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeMenuItemStoreIdToArray1729432800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add new storeIds column as UUID array
    await queryRunner.query(`
      ALTER TABLE "menu_items"
      ADD COLUMN "storeIds" uuid[] DEFAULT '{}'
    `);

    // Step 2: Migrate data from storeId to storeIds
    await queryRunner.query(`
      UPDATE "menu_items"
      SET "storeIds" = ARRAY["storeId"]
      WHERE "storeId" IS NOT NULL
    `);

    // Step 3: Drop the old storeId column
    await queryRunner.query(`
      ALTER TABLE "menu_items"
      DROP COLUMN "storeId"
    `);

    // Step 4: Drop the old index on storeId
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_menu_items_storeId"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add back the old storeId column
    await queryRunner.query(`
      ALTER TABLE "menu_items"
      ADD COLUMN "storeId" uuid
    `);

    // Step 2: Migrate data from storeIds back to storeId (take first store)
    await queryRunner.query(`
      UPDATE "menu_items"
      SET "storeId" = "storeIds"[1]
      WHERE "storeIds" IS NOT NULL AND array_length("storeIds", 1) > 0
    `);

    // Step 3: Drop the storeIds column
    await queryRunner.query(`
      ALTER TABLE "menu_items"
      DROP COLUMN "storeIds"
    `);

    // Step 4: Recreate the index on storeId
    await queryRunner.query(`
      CREATE INDEX "IDX_menu_items_storeId" ON "menu_items" ("storeId")
    `);
  }
}

