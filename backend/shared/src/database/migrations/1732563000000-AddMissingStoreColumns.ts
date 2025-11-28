import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingStoreColumns1732563000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add missing columns to stores table for backward compatibility with admin website
    await queryRunner.query(`
      ALTER TABLE stores
      ADD COLUMN IF NOT EXISTS email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS accepting_orders BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS store_image_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS description TEXT
    `);

    // Set default values for existing stores
    await queryRunner.query(`
      UPDATE stores
      SET accepting_orders = true
      WHERE accepting_orders IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE stores
      DROP COLUMN IF EXISTS email,
      DROP COLUMN IF EXISTS accepting_orders,
      DROP COLUMN IF EXISTS store_image_url,
      DROP COLUMN IF EXISTS description
    `);
  }
}

