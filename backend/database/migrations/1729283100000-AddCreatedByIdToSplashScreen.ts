import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedByIdToSplashScreen1729283100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "splash_screens"
      ADD COLUMN "created_by_id" uuid NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_splash_screens_created_by_id" ON "splash_screens" ("created_by_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "idx_splash_screens_created_by_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "splash_screens"
      DROP COLUMN "created_by_id"
    `);
  }
}

