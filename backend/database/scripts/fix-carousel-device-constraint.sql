-- Fix carousel_events device_id foreign key constraint
-- 
-- Problem: carousel_events.device_id has a foreign key to user_devices,
-- but anonymous devices (before login) are stored in anonymous_devices table.
-- This causes 500 errors when tracking carousel events from anonymous users.
-- 
-- Solution: Remove the foreign key constraint to allow both anonymous and
-- registered device IDs, similar to how splash_events was fixed.

-- Drop existing foreign key constraint if it exists
ALTER TABLE carousel_events
DROP CONSTRAINT IF EXISTS carousel_events_device_id_fkey;

-- Add comment to document why there's no FK constraint
COMMENT ON COLUMN carousel_events.device_id IS 
'Device ID - can reference either anonymous_devices.device_id (before login) or user_devices.device_id (after login). No FK constraint to support both.';

-- Verify the constraint was removed
SELECT 
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'carousel_events'::regclass
AND conname LIKE '%device%';

