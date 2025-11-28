import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSplashAnalyticsTables1732675200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // =====================================================================
    // 1) RAW EVENT LOGGING — splash_events
    // =====================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS splash_events (
        splash_event_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        splash_id                UUID NOT NULL 
                                     REFERENCES splash_screens(splash_id)
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
        experiment_group         VARCHAR(20),
        event_type               VARCHAR(20) NOT NULL
                                     CHECK (event_type IN (
                                         'impression',
                                         'click',
                                         'skip',
                                         'complete',
                                         'order'
                                     )),
        view_time_seconds        INT,
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
        created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Indexes for analytics performance
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_splash_events_splash_id ON splash_events (splash_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_splash_events_user_id ON splash_events (user_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_splash_events_event_type ON splash_events (event_type)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_splash_events_timestamp ON splash_events (server_timestamp)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_splash_events_store_id ON splash_events (store_id)`);

    // =====================================================================
    // 2) SESSION-LEVEL ANALYTICS — splash_sessions
    // =====================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS splash_sessions (
        splash_session_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        splash_id                UUID NOT NULL
                                     REFERENCES splash_screens(splash_id)
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
        session_id               UUID NOT NULL,
        started_at               TIMESTAMPTZ NOT NULL,
        ended_at                 TIMESTAMPTZ,
        total_time_seconds       INT,
        was_skipped              BOOLEAN DEFAULT FALSE,
        was_clicked              BOOLEAN DEFAULT FALSE,
        auto_completed           BOOLEAN DEFAULT FALSE,
        order_id                 UUID
                                     REFERENCES orders(order_id)
                                     ON DELETE SET NULL,
        was_converted            BOOLEAN DEFAULT FALSE,
        conversion_time_seconds  INT,
        segment_id               UUID
                                     REFERENCES user_segments(segment_id)
                                     ON DELETE SET NULL,
        experiment_group         VARCHAR(20),
        app_version              VARCHAR(50),
        os_type                  VARCHAR(20),
        device_model             VARCHAR(100),
        created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_splash_sessions_splash_id ON splash_sessions (splash_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_splash_sessions_user_id ON splash_sessions (user_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_splash_sessions_session_id ON splash_sessions (session_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_splash_sessions_started_at ON splash_sessions (started_at)`);

    // =====================================================================
    // 3) DAILY AGGREGATES — splash_daily_aggregates
    // =====================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS splash_daily_aggregates (
        splash_daily_aggregate_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        date                       DATE NOT NULL,
        splash_id                  UUID NOT NULL
                                       REFERENCES splash_screens(splash_id)
                                       ON DELETE CASCADE,
        impressions                BIGINT DEFAULT 0,
        unique_users_shown        BIGINT DEFAULT 0,
        clicks                     BIGINT DEFAULT 0,
        unique_users_clicked       BIGINT DEFAULT 0,
        skips                      BIGINT DEFAULT 0,
        completions                BIGINT DEFAULT 0,
        avg_view_time_seconds      NUMERIC(10,2) DEFAULT 0,
        associated_orders          BIGINT DEFAULT 0,
        associated_revenue         NUMERIC(12,2) DEFAULT 0,
        avg_order_value            NUMERIC(10,2) DEFAULT 0,
        conversion_rate            NUMERIC(6,4) DEFAULT 0,
        ctr                        NUMERIC(6,4) DEFAULT 0,
        skip_rate                  NUMERIC(6,4) DEFAULT 0,
        created_at                 TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Unique constraint ensures one row per day per splash
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_splash_daily_agg_date_splash ON splash_daily_aggregates(date, splash_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS splash_daily_aggregates CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS splash_sessions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS splash_events CASCADE`);
  }
}

