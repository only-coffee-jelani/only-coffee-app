import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fix carousel_events device_id foreign key constraint
 * 
 * Problem: carousel_events.device_id has a foreign key to user_devices,
 * but anonymous devices (before login) are stored in anonymous_devices table.
 * This causes 500 errors when tracking carousel events from anonymous users.
 * 
 * Solution: Remove the foreign key constraint to allow both anonymous and
 * registered device IDs, similar to how splash_events was fixed.
 */
export class FixCarouselEventsDeviceConstraint1732900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔧 Fixing carousel_events device_id constraint...');

    // Drop existing foreign key constraint if it exists
    await queryRunner.query(`
      ALTER TABLE carousel_events
      DROP CONSTRAINT IF EXISTS carousel_events_device_id_fkey
    `);

    console.log('✅ Removed carousel_events device_id foreign key constraint');

    // Add comment to document why there's no FK constraint
    await queryRunner.query(`
      COMMENT ON COLUMN carousel_events.device_id IS 
      'Device ID - can reference either anonymous_devices.device_id (before login) or user_devices.device_id (after login). No FK constraint to support both.'
    `);

    console.log('✅ Added documentation comment');
    console.log('✅ Carousel events device constraint fix completed successfully!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔧 Reverting carousel_events device_id constraint fix...');

    // Re-add the foreign key constraint (this will fail if there are anonymous device IDs)
    await queryRunner.query(`
      ALTER TABLE carousel_events
      ADD CONSTRAINT carousel_events_device_id_fkey
      FOREIGN KEY (device_id) REFERENCES user_devices(device_id) ON DELETE SET NULL
    `);

    console.log('✅ Reverted carousel_events device_id constraint');
  }
}

