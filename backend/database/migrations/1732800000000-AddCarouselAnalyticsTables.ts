import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add Carousel Analytics Tables
 * 
 * Creates comprehensive analytics infrastructure for carousel tracking:
 * 1. carousel_events - Raw event tracking (impressions, clicks, swipes, conversions)
 * 2. carousel_sessions - User session tracking with engagement metrics
 * 3. carousel_daily_aggregates - Pre-computed daily metrics for fast dashboards
 * 4. carousel_ab_tests - A/B testing framework for carousel optimization
 * 
 * This analytics system is more advanced than splash screen analytics with:
 * - Swipe direction tracking (left/right)
 * - Position-in-carousel tracking
 * - Time-on-slide metrics
 * - A/B testing capabilities
 * - Engagement scoring
 * - Conversion funnel tracking
 */
export class AddCarouselAnalyticsTables1732800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not already enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // =====================================================================
    // 1) EVENTS TABLE — carousel_events
    // =====================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS carousel_events (
        carousel_event_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        carousel_item_id         UUID NOT NULL 
                                     REFERENCES carousel_items(carousel_item_id)
                                     ON DELETE CASCADE,
        carousel_id              UUID NOT NULL
                                     REFERENCES carousels(carousel_id)
                                     ON DELETE CASCADE,
        user_id                  UUID 
                                     REFERENCES users(user_id)
                                     ON DELETE SET NULL,
        device_id                UUID
                                     REFERENCES user_devices(device_id)
                                     ON DELETE SET NULL,
        store_id                 UUID
                                     REFERENCES stores(store_id)
                                     ON DELETE SET NULL,
        segment_id               UUID
                                     REFERENCES user_segments(segment_id)
                                     ON DELETE SET NULL,
        experiment_group         VARCHAR(50),
        event_type               VARCHAR(30) NOT NULL
                                     CHECK (event_type IN (
                                         'impression',
                                         'click',
                                         'swipe_left',
                                         'swipe_right',
                                         'auto_advance',
                                         'manual_advance',
                                         'view_complete',
                                         'order',
                                         'add_to_cart'
                                     )),
        position_in_carousel     INT NOT NULL,
        total_items_in_carousel  INT NOT NULL,
        time_on_slide_seconds    NUMERIC(10,2),
        swipe_velocity           NUMERIC(10,2),
        deeplink                 VARCHAR(255),
        order_id                 UUID 
                                     REFERENCES orders(order_id)
                                     ON DELETE SET NULL,
        revenue_amount           NUMERIC(10,2),
        client_timestamp         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        server_timestamp         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        app_version              VARCHAR(50),
        os_type                  VARCHAR(20) CHECK (os_type IN ('ios', 'android', 'web')),
        device_model             VARCHAR(100),
        screen_width             INT,
        screen_height            INT,
        connection_type          VARCHAR(20),
        created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes for optimal query performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_carousel_events_carousel_item 
      ON carousel_events(carousel_item_id, created_at DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_carousel_events_user 
      ON carousel_events(user_id, created_at DESC) 
      WHERE user_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_carousel_events_device 
      ON carousel_events(device_id, created_at DESC) 
      WHERE device_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_carousel_events_type_timestamp 
      ON carousel_events(event_type, created_at DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_carousel_events_order 
      ON carousel_events(order_id) 
      WHERE order_id IS NOT NULL
    `);

    console.log('✅ Created carousel_events table with indexes');

    // =====================================================================
    // 2) SESSIONS TABLE — carousel_sessions
    // =====================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS carousel_sessions (
        carousel_session_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        session_id               UUID NOT NULL,
        carousel_id              UUID NOT NULL
                                     REFERENCES carousels(carousel_id)
                                     ON DELETE CASCADE,
        user_id                  UUID
                                     REFERENCES users(user_id)
                                     ON DELETE SET NULL,
        device_id                UUID
                                     REFERENCES user_devices(device_id)
                                     ON DELETE SET NULL,
        store_id                 UUID
                                     REFERENCES stores(store_id)
                                     ON DELETE SET NULL,
        started_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ended_at                 TIMESTAMPTZ,
        total_time_seconds       INT,
        items_viewed             INT DEFAULT 0,
        items_clicked            INT DEFAULT 0,
        swipes_left              INT DEFAULT 0,
        swipes_right             INT DEFAULT 0,
        auto_advances            INT DEFAULT 0,
        manual_advances          INT DEFAULT 0,
        engagement_score         NUMERIC(5,2) DEFAULT 0,
        was_converted            BOOLEAN DEFAULT FALSE,
        conversion_time_seconds  INT,
        order_id                 UUID
                                     REFERENCES orders(order_id)
                                     ON DELETE SET NULL,
        revenue_amount           NUMERIC(12,2),
        segment_id               UUID
                                     REFERENCES user_segments(segment_id)
                                     ON DELETE SET NULL,
        experiment_group         VARCHAR(50),
        app_version              VARCHAR(50),
        os_type                  VARCHAR(20),
        device_model             VARCHAR(100),
        created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes for carousel sessions
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_carousel_sessions_carousel
      ON carousel_sessions(carousel_id, started_at DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_carousel_sessions_user
      ON carousel_sessions(user_id, started_at DESC)
      WHERE user_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_carousel_sessions_device
      ON carousel_sessions(device_id, started_at DESC)
      WHERE device_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_carousel_sessions_conversion
      ON carousel_sessions(was_converted, started_at DESC)
      WHERE was_converted = TRUE
    `);

    console.log('✅ Created carousel_sessions table with indexes');

    // =====================================================================
    // 3) DAILY AGGREGATES — carousel_daily_aggregates
    // =====================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS carousel_daily_aggregates (
        carousel_daily_aggregate_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        date                         DATE NOT NULL,
        carousel_item_id             UUID NOT NULL
                                         REFERENCES carousel_items(carousel_item_id)
                                         ON DELETE CASCADE,
        carousel_id                  UUID NOT NULL
                                         REFERENCES carousels(carousel_id)
                                         ON DELETE CASCADE,
        impressions                  BIGINT DEFAULT 0,
        unique_users_shown           BIGINT DEFAULT 0,
        unique_devices_shown         BIGINT DEFAULT 0,
        clicks                       BIGINT DEFAULT 0,
        unique_users_clicked         BIGINT DEFAULT 0,
        swipes_left                  BIGINT DEFAULT 0,
        swipes_right                 BIGINT DEFAULT 0,
        auto_advances                BIGINT DEFAULT 0,
        manual_advances              BIGINT DEFAULT 0,
        view_completions             BIGINT DEFAULT 0,
        avg_time_on_slide_seconds    NUMERIC(10,2) DEFAULT 0,
        avg_engagement_score         NUMERIC(5,2) DEFAULT 0,
        associated_orders            BIGINT DEFAULT 0,
        associated_revenue           NUMERIC(12,2) DEFAULT 0,
        add_to_cart_count            BIGINT DEFAULT 0,
        avg_order_value              NUMERIC(10,2) DEFAULT 0,
        conversion_rate              NUMERIC(6,4) DEFAULT 0,
        ctr                          NUMERIC(6,4) DEFAULT 0,
        engagement_rate              NUMERIC(6,4) DEFAULT 0,
        position_in_carousel         INT NOT NULL,
        created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Create unique constraint and indexes
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_carousel_daily_aggregates_unique
      ON carousel_daily_aggregates(date, carousel_item_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_carousel_daily_aggregates_carousel
      ON carousel_daily_aggregates(carousel_id, date DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_carousel_daily_aggregates_date
      ON carousel_daily_aggregates(date DESC)
    `);

    console.log('✅ Created carousel_daily_aggregates table with indexes');

    // =====================================================================
    // 4) A/B TESTING TABLE — carousel_ab_tests
    // =====================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS carousel_ab_tests (
        carousel_ab_test_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        test_name                VARCHAR(255) NOT NULL,
        description              TEXT,
        carousel_id              UUID NOT NULL
                                     REFERENCES carousels(carousel_id)
                                     ON DELETE CASCADE,
        variant_a_item_id        UUID NOT NULL
                                     REFERENCES carousel_items(carousel_item_id)
                                     ON DELETE CASCADE,
        variant_b_item_id        UUID NOT NULL
                                     REFERENCES carousel_items(carousel_item_id)
                                     ON DELETE CASCADE,
        traffic_split            NUMERIC(3,2) DEFAULT 0.50,
        status                   VARCHAR(20) DEFAULT 'draft'
                                     CHECK (status IN ('draft', 'running', 'paused', 'completed')),
        started_at               TIMESTAMPTZ,
        ended_at                 TIMESTAMPTZ,
        winner_variant           VARCHAR(10) CHECK (winner_variant IN ('A', 'B', 'tie')),
        confidence_level         NUMERIC(5,2),
        primary_metric           VARCHAR(50) DEFAULT 'ctr'
                                     CHECK (primary_metric IN ('ctr', 'conversion_rate', 'engagement_score', 'revenue')),
        variant_a_impressions    BIGINT DEFAULT 0,
        variant_a_clicks         BIGINT DEFAULT 0,
        variant_a_conversions    BIGINT DEFAULT 0,
        variant_a_revenue        NUMERIC(12,2) DEFAULT 0,
        variant_b_impressions    BIGINT DEFAULT 0,
        variant_b_clicks         BIGINT DEFAULT 0,
        variant_b_conversions    BIGINT DEFAULT 0,
        variant_b_revenue        NUMERIC(12,2) DEFAULT 0,
        created_by               UUID REFERENCES admin_users(admin_user_id),
        created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes for A/B tests
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_carousel_ab_tests_carousel
      ON carousel_ab_tests(carousel_id, status)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_carousel_ab_tests_status
      ON carousel_ab_tests(status, started_at DESC)
    `);

    console.log('✅ Created carousel_ab_tests table with indexes');

    // =====================================================================
    // 5) POSITION PERFORMANCE TABLE — carousel_position_performance
    // =====================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS carousel_position_performance (
        position_performance_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        carousel_id              UUID NOT NULL
                                     REFERENCES carousels(carousel_id)
                                     ON DELETE CASCADE,
        position                 INT NOT NULL,
        date                     DATE NOT NULL,
        impressions              BIGINT DEFAULT 0,
        clicks                   BIGINT DEFAULT 0,
        ctr                      NUMERIC(6,4) DEFAULT 0,
        avg_time_viewed          NUMERIC(10,2) DEFAULT 0,
        swipe_through_rate       NUMERIC(6,4) DEFAULT 0,
        created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_carousel_position_performance_unique
      ON carousel_position_performance(carousel_id, position, date)
    `);

    console.log('✅ Created carousel_position_performance table');

    console.log('🎉 Carousel analytics tables created successfully!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order to respect foreign key constraints
    await queryRunner.query(`DROP TABLE IF EXISTS carousel_position_performance CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS carousel_ab_tests CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS carousel_daily_aggregates CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS carousel_sessions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS carousel_events CASCADE`);

    console.log('✅ Carousel analytics tables dropped');
  }
}


