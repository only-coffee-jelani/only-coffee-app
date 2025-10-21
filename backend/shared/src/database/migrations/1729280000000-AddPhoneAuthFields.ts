import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhoneAuthFields1729280000000 implements MigrationInterface {
  name = 'AddPhoneAuthFields1729280000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add missing columns to users table for phone authentication
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "marketingOptIn" boolean NOT NULL DEFAULT false,
      ADD COLUMN "verificationCode" varchar(6),
      ADD COLUMN "verificationCodeExpiry" timestamptz
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "marketingOptIn",
      DROP COLUMN "verificationCode",
      DROP COLUMN "verificationCodeExpiry"
    `);
  }
}
