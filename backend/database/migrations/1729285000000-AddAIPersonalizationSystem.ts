import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAIPersonalizationSystem1729285000000 implements MigrationInterface {
  name = 'AddAIPersonalizationSystem1729285000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_events table for behavioral tracking
    await queryRunner.query(`
      CREATE TYPE "event_type_enum" AS ENUM (
        'app_opened', 'app_closed', 'purchase_completed', 'cart_abandoned',
        'menu_viewed', 'item_viewed', 'search_performed', 'filter_applied',
        'notification_opened', 'notification_dismissed', 'promotion_viewed', 'promotion_clicked',
        'location_entered', 'location_exited', 'geofence_triggered',
        'profile_updated', 'preference_changed', 'loyalty_checked', 'reward_viewed'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_events" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "eventType" event_type_enum NOT NULL,
        "timestamp" timestamptz NOT NULL DEFAULT now(),
        "metadata" jsonb,
        "sessionId" uuid,
        "deviceType" varchar(50),
        "appVersion" varchar(20),
        "location" geography(POINT),
        "storeId" uuid,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_user_events_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_events_storeId" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL
      )
    `);

    // Partition by month for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_user_events_userId_timestamp" ON "user_events" ("userId", "timestamp" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_events_eventType_timestamp" ON "user_events" ("eventType", "timestamp" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_events_sessionId" ON "user_events" ("sessionId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_events_metadata" ON "user_events" USING gin("metadata")
    `);

    // Create user_profiles table for ML features and derived metrics
    await queryRunner.query(`
      CREATE TYPE "user_segment_enum" AS ENUM (
        'morning_regular', 'weekend_warrior', 'daily_dependent', 'occasional_visitor',
        'price_sensitive', 'loyalist', 'at_risk', 'lapsed', 'new_user'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_profiles" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL UNIQUE,
        "segment" user_segment_enum,
        "churnRiskScore" decimal(5,4),
        "lifetimeValue" decimal(10,2),
        "avgPurchaseInterval" decimal(8,2),
        "preferredStoreId" uuid,
        "favoriteCategory" varchar(100),
        "favoriteDrinkId" uuid,
        "avgOrderValue" decimal(10,2),
        "totalPurchases" int NOT NULL DEFAULT 0,
        "lastPurchaseDate" timestamptz,
        "firstPurchaseDate" timestamptz,
        "notificationOpenRate" decimal(5,4),
        "notificationFatigueScore" decimal(5,4),
        "preferredNotificationTime" int,
        "timeZone" varchar(50),
        "features" jsonb,
        "lastSegmentUpdate" timestamptz,
        "lastFeatureUpdate" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_user_profiles_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_profiles_preferredStoreId" FOREIGN KEY ("preferredStoreId") REFERENCES "stores"("id") ON DELETE SET NULL,
        CONSTRAINT "UQ_user_profiles_userId" UNIQUE ("userId")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_profiles_segment" ON "user_profiles" ("segment")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_profiles_churnRiskScore" ON "user_profiles" ("churnRiskScore" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_profiles_lastPurchaseDate" ON "user_profiles" ("lastPurchaseDate")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_profiles_features" ON "user_profiles" USING gin("features")
    `);

    // Create ai_promotions table for AI-generated promotions awaiting admin review
    await queryRunner.query(`
      CREATE TYPE "promotion_type_enum" AS ENUM (
        'discount_percentage', 'discount_fixed', 'free_upgrade', 'loyalty_bonus',
        'streak_reward', 'win_back', 'product_recommendation', 'location_trigger',
        'time_based', 'weather_based', 'milestone_celebration'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "promotion_status_enum" AS ENUM (
        'pending', 'approved', 'rejected', 'scheduled', 'sent', 'completed', 'expired'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "delivery_channel_enum" AS ENUM (
        'push_notification', 'in_app_modal', 'email', 'sms'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "ai_promotions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "type" promotion_type_enum NOT NULL,
        "status" promotion_status_enum NOT NULL DEFAULT 'pending',
        "targetUserId" uuid,
        "targetSegment" user_segment_enum,
        "triggerType" varchar(100) NOT NULL,
        "triggerMetadata" jsonb,
        "title" varchar(200) NOT NULL,
        "message" text NOT NULL,
        "offerDetails" jsonb NOT NULL,
        "discountPercentage" int,
        "discountAmountCents" int,
        "deliveryChannel" delivery_channel_enum NOT NULL DEFAULT 'push_notification',
        "scheduledFor" timestamptz,
        "expiresAt" timestamptz,
        "predictedCTR" decimal(5,4),
        "predictedConversion" decimal(5,4),
        "confidenceScore" decimal(5,4),
        "modelVersion" varchar(50),
        "aiReasoning" text,
        "reviewedBy" uuid,
        "reviewedAt" timestamptz,
        "reviewNotes" text,
        "sentAt" timestamptz,
        "metadata" jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_ai_promotions_targetUserId" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ai_promotions_reviewedBy" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ai_promotions_status" ON "ai_promotions" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ai_promotions_targetUserId" ON "ai_promotions" ("targetUserId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ai_promotions_targetSegment" ON "ai_promotions" ("targetSegment")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ai_promotions_scheduledFor" ON "ai_promotions" ("scheduledFor")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ai_promotions_createdAt" ON "ai_promotions" ("createdAt" DESC)
    `);

    // Create promotion_executions table for delivery tracking and outcomes
    await queryRunner.query(`
      CREATE TYPE "execution_status_enum" AS ENUM (
        'queued', 'sending', 'delivered', 'opened', 'clicked', 'redeemed', 'expired', 'failed'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "promotion_executions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "promotionId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "status" execution_status_enum NOT NULL DEFAULT 'queued',
        "channel" delivery_channel_enum NOT NULL,
        "queuedAt" timestamptz NOT NULL DEFAULT now(),
        "sentAt" timestamptz,
        "deliveredAt" timestamptz,
        "openedAt" timestamptz,
        "clickedAt" timestamptz,
        "redeemedAt" timestamptz,
        "expiredAt" timestamptz,
        "failureReason" text,
        "notificationId" varchar(200),
        "deviceToken" varchar(500),
        "metadata" jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_promotion_executions_promotionId" FOREIGN KEY ("promotionId") REFERENCES "ai_promotions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_promotion_executions_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_promotion_executions_promotionId" ON "promotion_executions" ("promotionId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_promotion_executions_userId_status" ON "promotion_executions" ("userId", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_promotion_executions_sentAt" ON "promotion_executions" ("sentAt")
    `);

    // Create user_segments table for segment membership tracking
    await queryRunner.query(`
      CREATE TABLE "user_segments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "segment" user_segment_enum NOT NULL,
        "confidence" decimal(5,4),
        "features" jsonb,
        "assignedAt" timestamptz NOT NULL DEFAULT now(),
        "validUntil" timestamptz,
        "modelVersion" varchar(50),
        "metadata" jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_user_segments_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_segments_userId_assignedAt" ON "user_segments" ("userId", "assignedAt" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_segments_segment" ON "user_segments" ("segment")
    `);

    // Create model_logs table for ML decision audit trail
    await queryRunner.query(`
      CREATE TYPE "model_type_enum" AS ENUM (
        'churn_prediction', 'product_recommender', 'contextual_bandit',
        'time_optimizer', 'segmentation', 'offer_optimizer'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "model_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "modelType" model_type_enum NOT NULL,
        "modelVersion" varchar(50) NOT NULL,
        "userId" uuid,
        "promotionId" uuid,
        "inputFeatures" jsonb NOT NULL,
        "prediction" jsonb NOT NULL,
        "confidenceScore" decimal(5,4),
        "executionTimeMs" int,
        "outcome" jsonb,
        "feedbackReceived" boolean NOT NULL DEFAULT false,
        "feedbackTimestamp" timestamptz,
        "metadata" jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_model_logs_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_model_logs_promotionId" FOREIGN KEY ("promotionId") REFERENCES "ai_promotions"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_model_logs_modelType_createdAt" ON "model_logs" ("modelType", "createdAt" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_model_logs_userId" ON "model_logs" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_model_logs_feedbackReceived" ON "model_logs" ("feedbackReceived")
    `);

    // Create notification_preferences table for user notification controls
    await queryRunner.query(`
      CREATE TABLE "notification_preferences" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL UNIQUE,
        "pushEnabled" boolean NOT NULL DEFAULT true,
        "emailEnabled" boolean NOT NULL DEFAULT true,
        "smsEnabled" boolean NOT NULL DEFAULT false,
        "promotionalEnabled" boolean NOT NULL DEFAULT true,
        "streakRemindersEnabled" boolean NOT NULL DEFAULT true,
        "locationTriggersEnabled" boolean NOT NULL DEFAULT true,
        "productLaunchesEnabled" boolean NOT NULL DEFAULT true,
        "maxNotificationsPerDay" int NOT NULL DEFAULT 3,
        "quietHoursStart" int,
        "quietHoursEnd" int,
        "preferredLanguage" varchar(10) NOT NULL DEFAULT 'en',
        "consentTimestamp" timestamptz,
        "attConsent" boolean,
        "locationConsent" boolean,
        "analyticsConsent" boolean NOT NULL DEFAULT true,
        "marketingConsent" boolean,
        "metadata" jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_notification_preferences_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_notification_preferences_userId" UNIQUE ("userId")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notification_preferences_promotionalEnabled" ON "notification_preferences" ("promotionalEnabled")
    `);

    // Add columns to existing users table for personalization
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "lastLocationUpdate" timestamptz,
      ADD COLUMN IF NOT EXISTS "homeLocationLat" decimal(10,8),
      ADD COLUMN IF NOT EXISTS "homeLocationLon" decimal(11,8),
      ADD COLUMN IF NOT EXISTS "pushToken" varchar(500),
      ADD COLUMN IF NOT EXISTS "devicePlatform" varchar(20),
      ADD COLUMN IF NOT EXISTS "appInstallDate" timestamptz,
      ADD COLUMN IF NOT EXISTS "lastAppVersion" varchar(20)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_lastLocationUpdate" ON "users" ("lastLocationUpdate")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes and columns from users table
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "lastAppVersion",
      DROP COLUMN IF EXISTS "appInstallDate",
      DROP COLUMN IF EXISTS "devicePlatform",
      DROP COLUMN IF EXISTS "pushToken",
      DROP COLUMN IF EXISTS "homeLocationLon",
      DROP COLUMN IF EXISTS "homeLocationLat",
      DROP COLUMN IF EXISTS "lastLocationUpdate"
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_lastLocationUpdate"`);

    // Drop notification_preferences table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notification_preferences_promotionalEnabled"`);
    await queryRunner.query(`DROP TABLE "notification_preferences"`);

    // Drop model_logs table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_model_logs_feedbackReceived"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_model_logs_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_model_logs_modelType_createdAt"`);
    await queryRunner.query(`DROP TABLE "model_logs"`);
    await queryRunner.query(`DROP TYPE "model_type_enum"`);

    // Drop user_segments table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_segments_segment"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_segments_userId_assignedAt"`);
    await queryRunner.query(`DROP TABLE "user_segments"`);

    // Drop promotion_executions table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_promotion_executions_sentAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_promotion_executions_userId_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_promotion_executions_promotionId"`);
    await queryRunner.query(`DROP TABLE "promotion_executions"`);
    await queryRunner.query(`DROP TYPE "execution_status_enum"`);

    // Drop ai_promotions table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ai_promotions_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ai_promotions_scheduledFor"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ai_promotions_targetSegment"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ai_promotions_targetUserId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ai_promotions_status"`);
    await queryRunner.query(`DROP TABLE "ai_promotions"`);
    await queryRunner.query(`DROP TYPE "delivery_channel_enum"`);
    await queryRunner.query(`DROP TYPE "promotion_status_enum"`);
    await queryRunner.query(`DROP TYPE "promotion_type_enum"`);

    // Drop user_profiles table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_profiles_features"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_profiles_lastPurchaseDate"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_profiles_churnRiskScore"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_profiles_segment"`);
    await queryRunner.query(`DROP TABLE "user_profiles"`);
    await queryRunner.query(`DROP TYPE "user_segment_enum"`);

    // Drop user_events table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_events_metadata"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_events_sessionId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_events_eventType_timestamp"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_events_userId_timestamp"`);
    await queryRunner.query(`DROP TABLE "user_events"`);
    await queryRunner.query(`DROP TYPE "event_type_enum"`);
  }
}
