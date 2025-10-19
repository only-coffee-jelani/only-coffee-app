import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueActiveConstraint1729283200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create a partial unique index that ensures only one row can have is_active = true
    // This is a PostgreSQL-specific feature that allows unique constraints on filtered rows
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_splash_screens_unique_active" 
      ON "splash_screens" ("is_active") 
      WHERE "is_active" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "idx_splash_screens_unique_active"
    `);
  }
}

