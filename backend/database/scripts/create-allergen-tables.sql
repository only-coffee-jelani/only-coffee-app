-- ============================================
-- ALLERGEN TABLES MIGRATION
-- ============================================

-- Create allergens lookup table
CREATE TABLE IF NOT EXISTS allergens (
  allergen_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              VARCHAR(100) NOT NULL UNIQUE,
  description       TEXT,
  icon              VARCHAR(50),
  sort_order        INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on name for fast lookups
CREATE INDEX IF NOT EXISTS idx_allergens_name ON allergens(name);

-- Create menu_item_allergens junction table
CREATE TABLE IF NOT EXISTS menu_item_allergens (
  menu_item_id      UUID NOT NULL REFERENCES menu_items(menu_item_id) ON DELETE CASCADE,
  allergen_id       UUID NOT NULL REFERENCES allergens(allergen_id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (menu_item_id, allergen_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_menu_item_allergens_menu_item ON menu_item_allergens(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_allergens_allergen ON menu_item_allergens(allergen_id);

-- Seed allergens data (only if table is empty)
INSERT INTO allergens (name, description, icon, sort_order)
SELECT * FROM (VALUES
  ('Gluten', 'Contains gluten from wheat, barley, rye, or oats', '🌾', 1),
  ('Eggs', 'Contains eggs or egg products', '🥚', 2),
  ('Soybeans', 'Contains soybeans or soy products', '🫘', 3),
  ('Milk', 'Contains milk or dairy products', '🥛', 4),
  ('Nuts', 'Contains tree nuts or peanuts', '🥜', 5)
) AS v(name, description, icon, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM allergens WHERE allergens.name = v.name);

-- Verify the data
SELECT 
  allergen_id,
  name,
  description,
  icon,
  sort_order
FROM allergens
ORDER BY sort_order;

