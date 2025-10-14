-- Only Coffee Store Locations
-- Run this after database is set up

-- Insert Store Locations
INSERT INTO "store" (id, name, address, city, state, zip_code, country, latitude, longitude, phone, email, is_active, created_at, updated_at)
VALUES
  (
    gen_random_uuid(),
    'Only Coffee - French Quarter',
    '636 St Ann St',
    'New Orleans',
    'LA',
    '70116',
    'USA',
    29.9584,
    -90.0644,
    '+1-504-555-0100',
    'frenchquarter@onlycoffee.com',
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Only Coffee - Houston Food Truck',
    'Houston Food Truck',
    'Houston',
    'TX',
    '77002',
    'USA',
    29.7604,
    -95.3698,
    '+1-713-555-0200',
    'houston@onlycoffee.com',
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Only Coffee - Galleria',
    'Galleria Mall Food Court (Next to Ice Rink)',
    'Houston',
    'TX',
    '77056',
    'USA',
    29.7389,
    -95.4617,
    '+1-713-555-0300',
    'galleria@onlycoffee.com',
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Only Coffee - SoHo',
    '433 Broadway',
    'New York',
    'NY',
    '10013',
    'USA',
    40.7205,
    -74.0009,
    '+1-212-555-0400',
    'soho@onlycoffee.com',
    true,
    NOW(),
    NOW()
  );

-- Add operating hours for each store (Monday-Sunday, 7am-7pm)
INSERT INTO "store_hours" (id, store_id, day_of_week, open_time, close_time, is_closed, created_at, updated_at)
SELECT
  gen_random_uuid(),
  s.id,
  d.day,
  '07:00:00',
  '19:00:00',
  false,
  NOW(),
  NOW()
FROM
  "store" s
CROSS JOIN (
  SELECT 0 AS day UNION ALL
  SELECT 1 UNION ALL
  SELECT 2 UNION ALL
  SELECT 3 UNION ALL
  SELECT 4 UNION ALL
  SELECT 5 UNION ALL
  SELECT 6
) d
WHERE s.name LIKE 'Only Coffee%';

-- Verify stores
SELECT
  name,
  address,
  city,
  state,
  phone
FROM "store"
WHERE name LIKE 'Only Coffee%'
ORDER BY city, name;
