import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMenuItemsForeignKey1729286400000 implements MigrationInterface {
  name = 'AddMenuItemsForeignKey1729286400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add foreign key constraint to menu_items.storeId
    await queryRunner.query(`
      ALTER TABLE "menu_items"
      ADD CONSTRAINT "FK_menu_items_storeId" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "menu_items"
      DROP CONSTRAINT "FK_menu_items_storeId"
    `);
  }
}

