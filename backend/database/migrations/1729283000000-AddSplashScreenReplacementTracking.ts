import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSplashScreenReplacementTracking1729283000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "splash_screens"
      ADD COLUMN "replaced_at" timestamptz NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "splash_screens"
      ADD COLUMN "replaced_by_id" uuid NULL
    `);

    // Create index for faster queries on replacement tracking
    await queryRunner.query(`
      CREATE INDEX "idx_splash_screens_replaced_at" ON "splash_screens" ("replaced_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_splash_screens_replaced_by_id" ON "splash_screens" ("replaced_by_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_splash_screens_replaced_by_id"`);
    await queryRunner.query(`DROP INDEX "idx_splash_screens_replaced_at"`);
    await queryRunner.query(`ALTER TABLE "splash_screens" DROP COLUMN "replaced_by_id"`);
    await queryRunner.query(`ALTER TABLE "splash_screens" DROP COLUMN "replaced_at"`);
  }
}

