-- Migration: Add timezone support to stores table
-- Date: 2025-11-28
-- Description: Adds timezone column to stores table for accurate open/closed calculations
-- Supports all IANA timezones worldwide (e.g., America/New_York, Europe/London, Asia/Tokyo)

-- Add timezone column to stores table
ALTER TABLE stores
ADD COLUMN timezone VARCHAR(50) DEFAULT 'America/Chicago';

-- Update existing stores with appropriate timezones based on their location
-- Seattle stores (PST/PDT)
UPDATE stores 
SET timezone = 'America/Los_Angeles' 
WHERE name LIKE '%Seattle%' OR name LIKE '%Bellevue%';

-- New Orleans stores (CST/CDT)
UPDATE stores 
SET timezone = 'America/Chicago' 
WHERE name LIKE '%New Orleans%' OR name LIKE '%NOLA%';

-- Houston stores (CST/CDT)
UPDATE stores 
SET timezone = 'America/Chicago' 
WHERE name LIKE '%Houston%';

-- New York stores (EST/EDT)
UPDATE stores 
SET timezone = 'America/New_York' 
WHERE name LIKE '%New York%' OR name LIKE '%NYC%';

-- Los Angeles stores (PST/PDT)
UPDATE stores 
SET timezone = 'America/Los_Angeles' 
WHERE name LIKE '%Los Angeles%' OR name LIKE '%LA%';

-- Make timezone NOT NULL after setting defaults
ALTER TABLE stores 
ALTER COLUMN timezone SET NOT NULL;

-- Add index for timezone queries
CREATE INDEX idx_stores_timezone ON stores(timezone);

-- Add comment
COMMENT ON COLUMN stores.timezone IS 'IANA timezone identifier (e.g., America/Chicago, Europe/London, Asia/Tokyo) for accurate store hours calculation. Supports all world timezones.';

