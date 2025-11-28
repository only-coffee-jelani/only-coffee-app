-- ============================================
-- ONLY COFFEE - ENTERPRISE SCHEMA
-- ============================================
-- This SQL file contains the complete enterprise-grade schema
-- for the Only Coffee application.
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- 0. Lookup / Enum-like Tables
-- ============================================

CREATE TABLE loyalty_tiers (
    loyalty_tier_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name              VARCHAR(50) UNIQUE NOT NULL,
    display_name      VARCHAR(100) NOT NULL,
    min_points        INT NOT NULL DEFAULT 0,
    max_points        INT NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE store_types (
    store_type_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code              VARCHAR(50) UNIQUE NOT NULL,
    description       VARCHAR(255),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE promotion_discount_types (
    promotion_discount_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code              VARCHAR(50) UNIQUE NOT NULL,
    description       VARCHAR(255),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_methods (
    payment_method_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code              VARCHAR(50) UNIQUE NOT NULL,
    description       VARCHAR(255),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_statuses (
    order_status_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code              VARCHAR(50) UNIQUE NOT NULL,
    description       VARCHAR(255),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 1. Admin Users & RBAC
-- ============================================

CREATE TABLE admin_users (
    admin_user_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email             VARCHAR(255) UNIQUE NOT NULL,
    password_hash     TEXT NOT NULL,
    first_name        VARCHAR(100),
    last_name         VARCHAR(100),
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_roles (
    admin_role_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name              VARCHAR(100) UNIQUE NOT NULL,
    description       TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_user_roles (
    admin_user_role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id     UUID NOT NULL REFERENCES admin_users(admin_user_id) ON DELETE CASCADE,
    admin_role_id     UUID NOT NULL REFERENCES admin_roles(admin_role_id) ON DELETE CASCADE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (admin_user_id, admin_role_id)
);

CREATE TABLE audit_logs (
    audit_log_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id     UUID REFERENCES admin_users(admin_user_id),
    action            VARCHAR(255) NOT NULL,
    entity_name       VARCHAR(255),
    entity_id         UUID,
    details           JSONB,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. Users, Devices, Sessions
-- ============================================

CREATE TABLE users (
    user_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email             VARCHAR(255) UNIQUE,
    phone             VARCHAR(20) UNIQUE,
    password_hash     TEXT,
    first_name        VARCHAR(100),
    last_name         VARCHAR(100),
    birthdate         DATE,
    loyalty_tier_id   UUID REFERENCES loyalty_tiers(loyalty_tier_id),
    loyalty_points    INT NOT NULL DEFAULT 0,
    default_store_id  UUID,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_devices (
    device_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    device_type       VARCHAR(20),
    push_token        TEXT,
    app_version       VARCHAR(20),
    os_version        VARCHAR(20),
    last_active_at    TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_sessions (
    session_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    device_id         UUID REFERENCES user_devices(device_id),
    ip_address        INET,
    user_agent        TEXT,
    started_at        TIMESTAMPTZ NOT NULL,
    ended_at          TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id, started_at);

-- ============================================
-- 3. Stores & Hours & Status History
-- ============================================

CREATE TABLE stores (
    store_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name              VARCHAR(255) NOT NULL,
    store_type_id     UUID REFERENCES store_types(store_type_id),
    address           TEXT,
    latitude          NUMERIC(10,7),
    longitude         NUMERIC(10,7),
    phone             VARCHAR(20),
    toast_location_id VARCHAR(100),
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    opened_at         TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE store_hours (
    store_hours_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id          UUID NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
    day_of_week       INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time         TIME NOT NULL,
    close_time        TIME NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE store_status_history (
    store_status_history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id          UUID NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
    status            VARCHAR(50) NOT NULL,
    reason            TEXT,
    changed_by        UUID REFERENCES admin_users(admin_user_id),
    changed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stores_active ON stores(is_active);
CREATE INDEX idx_store_status_history_store ON store_status_history(store_id, changed_at);

-- Add foreign key for users.default_store_id
ALTER TABLE users ADD CONSTRAINT fk_users_default_store FOREIGN KEY (default_store_id) REFERENCES stores(store_id);

-- ============================================
-- 4. Menu, Modifiers, and Media Assets
-- ============================================

CREATE TABLE media_assets (
    asset_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url               TEXT NOT NULL,
    alt_text          TEXT,
    type              VARCHAR(50) NOT NULL DEFAULT 'image',
    created_by        UUID REFERENCES admin_users(admin_user_id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE menu_categories (
    category_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name              VARCHAR(255) NOT NULL,
    description       TEXT,
    sort_order        INT NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE menu_items (
    menu_item_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id       UUID REFERENCES menu_categories(category_id),
    name              VARCHAR(255) NOT NULL,
    description       TEXT,
    base_price        NUMERIC(10,2) NOT NULL,
    calories          INT,
    image_asset_id    UUID REFERENCES media_assets(asset_id),
    toast_item_id     VARCHAR(100),
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_menu_items_category ON menu_items(category_id);

CREATE TABLE modifier_groups (
    modifier_group_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name              VARCHAR(255) NOT NULL,
    required          BOOLEAN NOT NULL DEFAULT FALSE,
    min_choices       INT NOT NULL DEFAULT 0,
    max_choices       INT NOT NULL DEFAULT 1,
    sort_order        INT NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE modifiers (
    modifier_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modifier_group_id UUID NOT NULL REFERENCES modifier_groups(modifier_group_id) ON DELETE CASCADE,
    name              VARCHAR(255) NOT NULL,
    price_delta       NUMERIC(10,2) NOT NULL DEFAULT 0,
    calories_delta    INT,
    sort_order        INT NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE menu_item_modifier_groups (
    menu_item_modifier_group_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id     UUID NOT NULL REFERENCES menu_items(menu_item_id) ON DELETE CASCADE,
    modifier_group_id UUID NOT NULL REFERENCES modifier_groups(modifier_group_id) ON DELETE CASCADE,
    UNIQUE (menu_item_id, modifier_group_id)
);

-- ============================================
-- 5. Splash Screens & Carousels
-- ============================================

CREATE TABLE splash_screens (
    splash_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title             VARCHAR(255),
    subtitle          VARCHAR(255),
    image_asset_id    UUID NOT NULL REFERENCES media_assets(asset_id),
    duration_seconds  INT NOT NULL DEFAULT 3,
    start_at          TIMESTAMPTZ,
    end_at            TIMESTAMPTZ,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    priority          INT NOT NULL DEFAULT 0,
    target_segment_id UUID,
    target_store_id   UUID REFERENCES stores(store_id),
    deeplink          VARCHAR(255),
    created_by        UUID REFERENCES admin_users(admin_user_id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE carousels (
    carousel_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name              VARCHAR(255) NOT NULL,
    placement         VARCHAR(100) NOT NULL,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE carousel_items (
    carousel_item_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carousel_id       UUID NOT NULL REFERENCES carousels(carousel_id) ON DELETE CASCADE,
    image_asset_id    UUID NOT NULL REFERENCES media_assets(asset_id),
    title             VARCHAR(255),
    subtitle          VARCHAR(255),
    deeplink          VARCHAR(255),
    sort_order        INT NOT NULL DEFAULT 0,
    start_at          TIMESTAMPTZ,
    end_at            TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 6. Orders, Order Items, Modifiers, Payments, Loyalty
-- ============================================

CREATE TABLE orders (
    order_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID REFERENCES users(user_id),
    store_id          UUID NOT NULL REFERENCES stores(store_id),
    order_status_id   UUID NOT NULL REFERENCES order_statuses(order_status_id),
    subtotal          NUMERIC(10,2) NOT NULL DEFAULT 0,
    tax               NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount_total    NUMERIC(10,2) NOT NULL DEFAULT 0,
    total             NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_method_id UUID REFERENCES payment_methods(payment_method_id),
    pickup_time       TIMESTAMPTZ,
    placed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id, placed_at);
CREATE INDEX idx_orders_store ON orders(store_id, placed_at);

CREATE TABLE order_items (
    order_item_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id          UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    menu_item_id      UUID NOT NULL REFERENCES menu_items(menu_item_id),
    quantity          INT NOT NULL DEFAULT 1,
    unit_price        NUMERIC(10,2) NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_item_modifiers (
    order_item_modifier_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id   UUID NOT NULL REFERENCES order_items(order_item_id) ON DELETE CASCADE,
    modifier_id     UUID NOT NULL REFERENCES modifiers(modifier_id),
    price_delta     NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payments (
    payment_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id          UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT,
    amount            NUMERIC(10,2) NOT NULL,
    status            VARCHAR(50) NOT NULL,
    failure_reason    TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE loyalty_ledger (
    loyalty_ledger_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    points_delta      INT NOT NULL,
    reason            VARCHAR(255),
    order_id          UUID REFERENCES orders(order_id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE gift_cards (
    gift_card_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code              VARCHAR(50) UNIQUE NOT NULL,
    balance           NUMERIC(10,2) NOT NULL DEFAULT 0,
    user_id           UUID REFERENCES users(user_id),
    expiration_date   DATE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Promotions & Redemptions

CREATE TABLE promotions (
    promotion_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name              VARCHAR(255) NOT NULL,
    description       TEXT,
    promotion_discount_type_id UUID NOT NULL REFERENCES promotion_discount_types(promotion_discount_type_id),
    discount_value    NUMERIC(10,2) NOT NULL,
    min_order_value   NUMERIC(10,2),
    start_date        DATE,
    end_date          DATE,
    max_redemptions   INT,
    created_by        UUID REFERENCES admin_users(admin_user_id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE promotion_redemptions (
    redemption_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id      UUID NOT NULL REFERENCES promotions(promotion_id) ON DELETE CASCADE,
    user_id           UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    order_id          UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    redeemed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (promotion_id, user_id, order_id)
);

-- ============================================
-- 7. AI / Personalization Tables
-- ============================================

CREATE TABLE user_segments (
    segment_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name              VARCHAR(255) NOT NULL,
    description       TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_segment_assignments (
    user_segment_assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    segment_id        UUID NOT NULL REFERENCES user_segments(segment_id) ON DELETE CASCADE,
    assigned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, segment_id)
);

CREATE TABLE user_events (
    event_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID REFERENCES users(user_id) ON DELETE CASCADE,
    session_id        UUID REFERENCES user_sessions(session_id),
    store_id          UUID REFERENCES stores(store_id),
    event_name        VARCHAR(255) NOT NULL,
    event_payload     JSONB,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_events_user ON user_events(user_id, created_at);
CREATE INDEX idx_user_events_name ON user_events(event_name, created_at);

CREATE TABLE user_profiles (
    user_id           UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    orders_last_30d   INT NOT NULL DEFAULT 0,
    avg_order_value   NUMERIC(10,2),
    total_ltv         NUMERIC(10,2),
    favorite_category VARCHAR(255),
    last_order_at     TIMESTAMPTZ,
    churn_risk_score  NUMERIC(5,4),
    ltv_score         NUMERIC(10,4),
    segment_primary_id UUID REFERENCES user_segments(segment_id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_predictions (
    prediction_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    prediction_type   VARCHAR(50) NOT NULL,
    score             NUMERIC(10,4) NOT NULL,
    model_version     VARCHAR(50),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_predictions_user_type ON ai_predictions(user_id, prediction_type, created_at);

CREATE TABLE ai_recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    menu_item_id      UUID NOT NULL REFERENCES menu_items(menu_item_id),
    rank              INT NOT NULL,
    reason            TEXT,
    model_version     VARCHAR(50),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, menu_item_id, rank)
);

CREATE TABLE ai_promotions (
    ai_promotion_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    promotion_id      UUID REFERENCES promotions(promotion_id),
    promotion_text    VARCHAR(255),
    discount_value    NUMERIC(10,2),
    discount_type     VARCHAR(20),
    model_version     VARCHAR(50),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Update splash_screens to reference user_segments
ALTER TABLE splash_screens ADD CONSTRAINT fk_splash_target_segment FOREIGN KEY (target_segment_id) REFERENCES user_segments(segment_id);

-- ============================================
-- 8. Reporting & Self-Service Analytics
-- ============================================

CREATE TABLE reportable_entities (
    entity_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name              VARCHAR(255) NOT NULL,
    table_name        VARCHAR(255) NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reportable_fields (
    field_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id         UUID NOT NULL REFERENCES reportable_entities(entity_id) ON DELETE CASCADE,
    column_name       VARCHAR(255) NOT NULL,
    display_name      VARCHAR(255) NOT NULL,
    data_type         VARCHAR(50) NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE filter_operators (
    operator_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_type         VARCHAR(50) NOT NULL,
    operator          VARCHAR(50) NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE saved_reports (
    saved_report_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id     UUID NOT NULL REFERENCES admin_users(admin_user_id) ON DELETE CASCADE,
    name              VARCHAR(255) NOT NULL,
    description       TEXT,
    query_json        JSONB NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE scheduled_reports (
    scheduled_report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    saved_report_id   UUID NOT NULL REFERENCES saved_reports(saved_report_id) ON DELETE CASCADE,
    cron_expression   VARCHAR(255) NOT NULL,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    last_run_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 9. Analytics-Focused Fact & Dimension Tables
-- ============================================

CREATE TABLE dim_date (
    date_key          DATE PRIMARY KEY,
    year              INT NOT NULL,
    month             INT NOT NULL,
    day               INT NOT NULL,
    week_of_year      INT NOT NULL,
    day_of_week       INT NOT NULL,
    is_weekend        BOOLEAN NOT NULL
);

CREATE TABLE dim_store (
    store_key         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id          UUID NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
    name              VARCHAR(255),
    city              VARCHAR(255),
    state             VARCHAR(255),
    type              VARCHAR(50),
    opened_at         TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE dim_user_segment (
    segment_key       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    segment_id        UUID NOT NULL REFERENCES user_segments(segment_id) ON DELETE CASCADE,
    name              VARCHAR(255),
    description       TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fact_orders (
    fact_order_id     BIGSERIAL PRIMARY KEY,
    order_id          UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    date_key          DATE NOT NULL REFERENCES dim_date(date_key),
    store_key         UUID REFERENCES dim_store(store_key),
    user_id           UUID REFERENCES users(user_id),
    segment_key       UUID REFERENCES dim_user_segment(segment_key),
    total             NUMERIC(10,2),
    discount_total    NUMERIC(10,2),
    tax               NUMERIC(10,2),
    items_count       INT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fact_user_events (
    fact_user_event_id BIGSERIAL PRIMARY KEY,
    user_id           UUID REFERENCES users(user_id),
    date_key          DATE NOT NULL REFERENCES dim_date(date_key),
    event_name        VARCHAR(255) NOT NULL,
    event_count       INT NOT NULL DEFAULT 0,
    store_key         UUID REFERENCES dim_store(store_key),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 10. Inventory Management
-- ============================================

CREATE TABLE inventory_items (
    inventory_item_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(255) NOT NULL,
    sku                 VARCHAR(100) UNIQUE,
    category            VARCHAR(100),
    unit                VARCHAR(50),
    default_cost        NUMERIC(10,4),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_items_category ON inventory_items (category);
CREATE INDEX idx_inventory_items_name_trgm ON inventory_items USING gin (name gin_trgm_ops);

CREATE TABLE store_inventory_levels (
    store_inventory_level_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id            UUID NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
    inventory_item_id   UUID NOT NULL REFERENCES inventory_items(inventory_item_id) ON DELETE CASCADE,
    quantity_on_hand    NUMERIC(12,3) NOT NULL DEFAULT 0,
    reorder_level       NUMERIC(12,3),
    reorder_quantity    NUMERIC(12,3),
    last_restocked_at   TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (store_id, inventory_item_id)
);

CREATE INDEX idx_store_inventory_levels_store ON store_inventory_levels (store_id, inventory_item_id);
CREATE INDEX idx_store_inventory_levels_item ON store_inventory_levels (inventory_item_id);

-- ============================================
-- 11. Refund Requests & Refunds
-- ============================================

CREATE TABLE refund_requests (
    refund_request_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id                UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    user_id                 UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    requested_amount        NUMERIC(10,2) NOT NULL,
    reason_code             VARCHAR(100),
    reason_text             TEXT,
    status                  VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    handled_by_admin_user_id UUID REFERENCES admin_users(admin_user_id),
    decided_at              TIMESTAMPTZ
);

CREATE INDEX idx_refund_requests_order ON refund_requests (order_id);
CREATE INDEX idx_refund_requests_user ON refund_requests (user_id, created_at);
CREATE INDEX idx_refund_requests_status ON refund_requests (status, created_at);

CREATE TABLE refunds (
    refund_id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    refund_request_id       UUID REFERENCES refund_requests(refund_request_id) ON DELETE SET NULL,
    order_id                UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    payment_id              UUID REFERENCES payments(payment_id) ON DELETE SET NULL,
    user_id                 UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    amount                  NUMERIC(10,2) NOT NULL,
    stripe_refund_id        TEXT,
    status                  VARCHAR(50) NOT NULL DEFAULT 'pending',
    failure_reason          TEXT,
    processed_by_admin_user_id UUID REFERENCES admin_users(admin_user_id),
    processed_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refunds_order ON refunds (order_id);
CREATE INDEX idx_refunds_user ON refunds (user_id, created_at);
CREATE INDEX idx_refunds_status ON refunds (status, created_at);
CREATE INDEX idx_refunds_request ON refunds (refund_request_id);

-- ============================================
-- END OF SCHEMA
-- ============================================

