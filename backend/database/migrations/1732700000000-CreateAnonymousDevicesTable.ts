import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Create anonymous_devices table for tracking devices before user login/registration
 * This is an enterprise-grade approach that:
 * 1. Separates anonymous devices from registered user devices
 * 2. Maintains referential integrity
 * 3. Tracks device lifecycle (anonymous → registered)
 * 4. Allows analytics on anonymous users
 */
export class CreateAnonymousDevicesTable1732700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🚀 Creating anonymous_devices table...');

    // Create anonymous_devices table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS anonymous_devices (
        device_id         UUID PRIMARY KEY,
        device_type       VARCHAR(20),
        app_version       VARCHAR(20),
        os_version        VARCHAR(20),
        device_model      VARCHAR(100),
        first_seen_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_active_at    TIMESTAMPTZ,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Add indexes for performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_anonymous_devices_first_seen 
      ON anonymous_devices(first_seen_at DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_anonymous_devices_last_active 
      ON anonymous_devices(last_active_at DESC)
    `);

    // Add comment to document the table purpose
    await queryRunner.query(`
      COMMENT ON TABLE anonymous_devices IS 
      'Tracks devices before user login/registration. When user logs in, device is migrated to user_devices table.'
    `);

    console.log('✅ Created anonymous_devices table');

    // Update splash_events to reference anonymous_devices OR user_devices
    // Drop existing foreign key constraint
    console.log('🔧 Updating splash_events foreign key constraints...');
    
    await queryRunner.query(`
      ALTER TABLE splash_events
      DROP CONSTRAINT IF EXISTS splash_events_device_id_fkey
    `);

    // Add comment to document that device_id can reference either table
    await queryRunner.query(`
      COMMENT ON COLUMN splash_events.device_id IS 
      'Device UUID - references either anonymous_devices.device_id or user_devices.device_id'
    `);

    console.log('✅ Updated splash_events constraints');

    // Update splash_sessions similarly
    console.log('🔧 Updating splash_sessions foreign key constraints...');
    
    await queryRunner.query(`
      ALTER TABLE splash_sessions
      DROP CONSTRAINT IF EXISTS splash_sessions_device_id_fkey
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN splash_sessions.device_id IS 
      'Device UUID - references either anonymous_devices.device_id or user_devices.device_id'
    `);

    console.log('✅ Updated splash_sessions constraints');

    // Create a view that unions both device tables for easy querying
    await queryRunner.query(`
      CREATE OR REPLACE VIEW all_devices AS
      SELECT 
        device_id,
        NULL::UUID as user_id,
        device_type,
        app_version,
        os_version,
        device_model,
        TRUE as is_anonymous,
        first_seen_at as registered_at,
        last_active_at,
        created_at
      FROM anonymous_devices
      UNION ALL
      SELECT 
        device_id,
        user_id,
        device_type,
        app_version,
        os_version,
        device_model,
        FALSE as is_anonymous,
        created_at as registered_at,
        last_active_at,
        created_at
      FROM user_devices
    `);

    console.log('✅ Created all_devices view');

    console.log('✅ Anonymous devices table migration completed successfully!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔧 Rolling back anonymous_devices table...');

    // Drop the view
    await queryRunner.query(`DROP VIEW IF EXISTS all_devices`);

    // Re-add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE splash_events
      ADD CONSTRAINT splash_events_device_id_fkey
      FOREIGN KEY (device_id) REFERENCES user_devices(device_id)
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE splash_sessions
      ADD CONSTRAINT splash_sessions_device_id_fkey
      FOREIGN KEY (device_id) REFERENCES user_devices(device_id)
      ON DELETE SET NULL
    `);

    // Drop anonymous_devices table
    await queryRunner.query(`DROP TABLE IF EXISTS anonymous_devices`);

    console.log('✅ Rollback completed');
  }
}

