import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhoneAuthFields1729280000000 implements MigrationInterface {
  name = 'AddPhoneAuthFields1729280000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add marketing_opt_in column
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "marketing_opt_in" boolean NOT NULL DEFAULT false
    `);

    // Add verification_code column
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "verification_code" varchar(6)
    `);

    // Add verification_code_expiry column
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "verification_code_expiry" timestamptz
    `);

    // Add index on verification_code for faster lookups during verification
    await queryRunner.query(`
      CREATE INDEX "IDX_users_verification_code" ON "users" ("verification_code")
      WHERE "verification_code" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_verification_code"`);

    // Drop columns in reverse order
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "verification_code_expiry"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "verification_code"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "marketing_opt_in"
    `);
  }
}
