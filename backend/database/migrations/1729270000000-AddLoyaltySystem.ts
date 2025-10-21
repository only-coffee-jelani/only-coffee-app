import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLoyaltySystem1729270000000 implements MigrationInterface {
  name = 'AddLoyaltySystem1729270000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // user_tier_enum already includes bronze, silver, gold, platinum, black from InitialSchema
    // No need to alter the enum

    // Create user_streaks table
    await queryRunner.query(`
      CREATE TABLE "user_streaks" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL UNIQUE,
        "consecutiveDays" int NOT NULL DEFAULT 0,
        "currentStreak" int NOT NULL DEFAULT 0,
        "longestStreak" int NOT NULL DEFAULT 0,
        "lastVisitDate" date,
        "firstQualifyingPurchaseDate" timestamptz,
        "streakStartDate" date,
        "monthlyPoints" int NOT NULL DEFAULT 0,
        "tierXP" int NOT NULL DEFAULT 0,
        "monthlyVisits" int NOT NULL DEFAULT 0,
        "annualSpend" decimal(10,2) NOT NULL DEFAULT 0,
        "sevenDayStreakCount" int NOT NULL DEFAULT 0,
        "lastMonthlyReset" date,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_user_streaks_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_user_streaks_userId" UNIQUE ("userId")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_streaks_userId" ON "user_streaks" ("userId")
    `);

    // Create streak_visits table
    await queryRunner.query(`
      CREATE TABLE "streak_visits" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "orderId" uuid NOT NULL,
        "visitDate" date NOT NULL,
        "orderAmount" decimal(10,2) NOT NULL,
        "isMorningRush" boolean NOT NULL DEFAULT false,
        "pointsEarned" int NOT NULL,
        "xpEarned" int NOT NULL,
        "basePoints" int NOT NULL,
        "baseXP" int NOT NULL,
        "multiplier" int NOT NULL DEFAULT 1,
        "streakDayAtVisit" int NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_streak_visits_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_streak_visits_userId_visitDate" ON "streak_visits" ("userId", "visitDate")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_streak_visits_visitDate" ON "streak_visits" ("visitDate")
    `);

    // Create streak_saver_tokens table
    await queryRunner.query(`
      CREATE TYPE "token_status_enum" AS ENUM ('available', 'used', 'expired')
    `);

    await queryRunner.query(`
      CREATE TABLE "streak_saver_tokens" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "status" token_status_enum NOT NULL DEFAULT 'available',
        "grantedAt" timestamptz NOT NULL,
        "usedAt" timestamptz,
        "appliedToDate" date,
        "expiresAt" timestamptz,
        "metadata" jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_streak_saver_tokens_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_streak_saver_tokens_userId_status" ON "streak_saver_tokens" ("userId", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_streak_saver_tokens_grantedAt" ON "streak_saver_tokens" ("grantedAt")
    `);

    // Create streak_rewards table
    await queryRunner.query(`
      CREATE TYPE "reward_type_enum" AS ENUM ('coupon_grant', 'points_grant')
    `);

    await queryRunner.query(`
      CREATE TABLE "streak_rewards" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "streakDay" int NOT NULL UNIQUE,
        "rewardType" reward_type_enum NOT NULL DEFAULT 'coupon_grant',
        "couponType" coupon_type_enum NOT NULL,
        "label" varchar(100) NOT NULL,
        "description" text,
        "valueCents" int,
        "maxValueCents" int,
        "expiryDays" int NOT NULL DEFAULT 7,
        "channels" varchar(20) NOT NULL DEFAULT 'both',
        "eligibleItems" jsonb,
        "isActive" boolean NOT NULL DEFAULT true,
        "displayOrder" int NOT NULL DEFAULT 0,
        "metadata" jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_streak_rewards_streakDay" UNIQUE ("streakDay")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_streak_rewards_streakDay" ON "streak_rewards" ("streakDay")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_streak_rewards_isActive" ON "streak_rewards" ("isActive")
    `);

    // Create anniversary_rewards table
    await queryRunner.query(`
      CREATE TYPE "anniversary_badge_enum" AS ENUM ('year_1_anniversary', 'year_2_anniversary', 'year_3_anniversary', 'year_5_anniversary', 'year_10_anniversary')
    `);

    await queryRunner.query(`
      CREATE TABLE "anniversary_rewards" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "anniversaryYear" int NOT NULL,
        "anniversaryDate" date NOT NULL,
        "isGranted" boolean NOT NULL DEFAULT false,
        "grantedAt" timestamptz,
        "couponId" uuid,
        "badgeAwarded" anniversary_badge_enum,
        "isRedeemed" boolean NOT NULL DEFAULT false,
        "redeemedAt" timestamptz,
        "customMessage" varchar(200),
        "metadata" jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_anniversary_rewards_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_anniversary_rewards_couponId" FOREIGN KEY ("couponId") REFERENCES "coupon_grants"("id") ON DELETE SET NULL,
        CONSTRAINT "UQ_anniversary_rewards_userId_year" UNIQUE ("userId", "anniversaryYear")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_anniversary_rewards_userId_anniversaryYear" ON "anniversary_rewards" ("userId", "anniversaryYear")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_anniversary_rewards_anniversaryDate" ON "anniversary_rewards" ("anniversaryDate")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_anniversary_rewards_isGranted" ON "anniversary_rewards" ("isGranted")
    `);

    // Create user_tier_history table
    await queryRunner.query(`
      CREATE TYPE "tier_change_reason_enum" AS ENUM ('qualified', 'downgraded', 'manual_override', 'initial_setup')
    `);

    await queryRunner.query(`
      CREATE TABLE "user_tier_history" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "previousTier" user_tier_enum,
        "newTier" user_tier_enum NOT NULL,
        "reason" tier_change_reason_enum NOT NULL,
        "changedAt" timestamptz NOT NULL,
        "monthlyVisitsAtChange" int,
        "tierXPAtChange" int,
        "annualSpendAtChange" decimal(10,2),
        "sevenDayStreakCountAtChange" int,
        "adminNotes" varchar(500),
        "metadata" jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_user_tier_history_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_tier_history_userId_changedAt" ON "user_tier_history" ("userId", "changedAt")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_tier_history_changedAt" ON "user_tier_history" ("changedAt")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_tier_history_newTier" ON "user_tier_history" ("newTier")
    `);

    // Create tier_perks table
    await queryRunner.query(`
      CREATE TYPE "perk_type_enum" AS ENUM ('birthday_reward', 'early_access', 'exclusive_discount', 'free_upgrade', 'priority_support', 'custom_reward')
    `);

    await queryRunner.query(`
      CREATE TABLE "tier_perks" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tier" user_tier_enum NOT NULL,
        "perkType" perk_type_enum NOT NULL,
        "perkName" varchar(100) NOT NULL,
        "description" text NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "displayOrder" int NOT NULL DEFAULT 0,
        "configuration" jsonb,
        "iconName" varchar(50),
        "metadata" jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tier_perks_tier_perkType" ON "tier_perks" ("tier", "perkType")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_tier_perks_isActive" ON "tier_perks" ("isActive")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tier_perks table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tier_perks_isActive"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tier_perks_tier_perkType"`);
    await queryRunner.query(`DROP TABLE "tier_perks"`);
    await queryRunner.query(`DROP TYPE "perk_type_enum"`);

    // Drop user_tier_history table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_tier_history_newTier"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_tier_history_changedAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_tier_history_userId_changedAt"`);
    await queryRunner.query(`DROP TABLE "user_tier_history"`);
    await queryRunner.query(`DROP TYPE "tier_change_reason_enum"`);

    // Drop anniversary_rewards table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_anniversary_rewards_isGranted"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_anniversary_rewards_anniversaryDate"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_anniversary_rewards_userId_anniversaryYear"`);
    await queryRunner.query(`DROP TABLE "anniversary_rewards"`);
    await queryRunner.query(`DROP TYPE "anniversary_badge_enum"`);

    // Drop streak_rewards table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_streak_rewards_isActive"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_streak_rewards_streakDay"`);
    await queryRunner.query(`DROP TABLE "streak_rewards"`);
    await queryRunner.query(`DROP TYPE "reward_type_enum"`);

    // Drop streak_saver_tokens table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_streak_saver_tokens_grantedAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_streak_saver_tokens_userId_status"`);
    await queryRunner.query(`DROP TABLE "streak_saver_tokens"`);
    await queryRunner.query(`DROP TYPE "token_status_enum"`);

    // Drop streak_visits table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_streak_visits_visitDate"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_streak_visits_userId_visitDate"`);
    await queryRunner.query(`DROP TABLE "streak_visits"`);

    // Drop user_streaks table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_streaks_userId"`);
    await queryRunner.query(`DROP TABLE "user_streaks"`);

    // Note: Cannot easily remove enum values from existing user_tier_enum
    // Would require recreating the enum and updating all references
    // For production, consider keeping the enum values even after rollback
  }
}
