import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileCompletedField1730400000000 implements MigrationInterface {
  name = 'AddProfileCompletedField1730400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add profile_completed column to users table
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "profile_completed" boolean NOT NULL DEFAULT false
    `);

    console.log('✅ Added profile_completed column to users table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop profile_completed column
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "profile_completed"
    `);

    console.log('✅ Removed profile_completed column from users table');
  }
}
