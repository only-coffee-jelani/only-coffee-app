import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBestSellersCategory1730000000000 implements MigrationInterface {
  name = 'AddBestSellersCategory1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new enum values: 'best_sellers' and 'other_drinks'
    // Keep 'chocolate' for backward compatibility
    await queryRunner.query(`
      ALTER TYPE menu_category_enum ADD VALUE IF NOT EXISTS 'best_sellers';
    `);

    await queryRunner.query(`
      ALTER TYPE menu_category_enum ADD VALUE IF NOT EXISTS 'other_drinks';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values directly
    // Migration down would require recreating the enum without these values
    // For now, we'll leave them in place as they won't cause issues
    console.log('Note: PostgreSQL enum values cannot be easily removed. Values will remain in enum.');
  }
}
