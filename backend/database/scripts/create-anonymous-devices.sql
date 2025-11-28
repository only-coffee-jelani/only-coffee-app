-- Create anonymous_devices table
CREATE TABLE IF NOT EXISTS anonymous_devices (
    device_id         UUID PRIMARY KEY,
    device_type       VARCHAR(20),
    app_version       VARCHAR(20),
    os_version        VARCHAR(20),
    device_model      VARCHAR(100),
    first_seen_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at    TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_anonymous_devices_first_seen 
ON anonymous_devices(first_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_anonymous_devices_last_active 
ON anonymous_devices(last_active_at DESC);

-- Add comment to document the table purpose
COMMENT ON TABLE anonymous_devices IS 
'Tracks devices before user login/registration. When user logs in, device is migrated to user_devices table.';

-- Update splash_events to remove foreign key constraint
ALTER TABLE splash_events
DROP CONSTRAINT IF EXISTS splash_events_device_id_fkey;

-- Add comment to document that device_id can reference either table
COMMENT ON COLUMN splash_events.device_id IS 
'Device UUID - references either anonymous_devices.device_id or user_devices.device_id';

-- Update splash_sessions similarly
ALTER TABLE splash_sessions
DROP CONSTRAINT IF EXISTS splash_sessions_device_id_fkey;

COMMENT ON COLUMN splash_sessions.device_id IS 
'Device UUID - references either anonymous_devices.device_id or user_devices.device_id';

-- Create a view that unions both device tables for easy querying
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
    NULL::VARCHAR(100) as device_model,
    FALSE as is_anonymous,
    created_at as registered_at,
    last_active_at,
    created_at
FROM user_devices;

SELECT 'Anonymous devices table created successfully!' as status;

