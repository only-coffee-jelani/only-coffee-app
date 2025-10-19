import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeSplashScreenDatesOptional1729282900000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "splash_screens"
      ALTER COLUMN "start_date" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "splash_screens"
      ALTER COLUMN "end_date" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "splash_screens"
      ALTER COLUMN "start_date" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "splash_screens"
      ALTER COLUMN "end_date" SET NOT NULL
    `);
  }
}

