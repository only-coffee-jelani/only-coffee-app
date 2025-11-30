-- Create Store Menu Items Junction Table
-- This enables many-to-many relationships between stores and menu items

-- Check if table exists and create if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'store_menu_items'
    ) THEN
        -- Create the junction table
        CREATE TABLE store_menu_items (
            store_id uuid NOT NULL,
            menu_item_id uuid NOT NULL,
            is_available boolean NOT NULL DEFAULT true,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now(),
            PRIMARY KEY (store_id, menu_item_id),
            CONSTRAINT fk_store_menu_items_store
                FOREIGN KEY (store_id)
                REFERENCES stores(store_id)
                ON DELETE CASCADE,
            CONSTRAINT fk_store_menu_items_menu_item
                FOREIGN KEY (menu_item_id)
                REFERENCES menu_items(menu_item_id)
                ON DELETE CASCADE
        );

        -- Create indexes for optimized queries
        CREATE INDEX idx_store_menu_items_store_id
            ON store_menu_items (store_id);

        CREATE INDEX idx_store_menu_items_menu_item_id
            ON store_menu_items (menu_item_id);

        CREATE INDEX idx_store_menu_items_is_available
            ON store_menu_items (is_available);

        RAISE NOTICE '✅ store_menu_items junction table created successfully';
    ELSE
        RAISE NOTICE '⚠️  store_menu_items table already exists';
    END IF;
END $$;

