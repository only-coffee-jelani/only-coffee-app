import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add Missing User Columns
 * 
 * Adds columns to the users table that are defined in the User entity
 * but missing from the enterprise schema:
 * - email_verified
 * - phone_verified
 * - marketing_opt_in
 * - is_active
 * - last_login_at
 * - role
 */
export class AddMissingUserColumns1732900000000 implements MigrationInterface {
  name = 'AddMissingUserColumns1732900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔧 Adding missing columns to users table...');

    // Add email_verified column
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "email_verified" BOOLEAN NOT NULL DEFAULT false
    `);

    // Add phone_verified column
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "phone_verified" BOOLEAN NOT NULL DEFAULT false
    `);

    // Add marketing_opt_in column
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "marketing_opt_in" BOOLEAN NOT NULL DEFAULT false
    `);

    // Add is_active column
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true
    `);

    // Add last_login_at column
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMPTZ
    `);

    // Add role column
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "role" VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER'
    `);

    // Create indexes for frequently queried columns
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_email_verified" ON "users" ("email_verified")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_is_active" ON "users" ("is_active")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_role" ON "users" ("role")
    `);

    console.log('✅ Successfully added missing columns to users table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔧 Removing added columns from users table...');

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_role"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_is_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email_verified"`);

    // Drop columns in reverse order
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "role"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "last_login_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "is_active"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "marketing_opt_in"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "phone_verified"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "email_verified"
    `);

    console.log('✅ Successfully removed columns from users table');
  }
}

