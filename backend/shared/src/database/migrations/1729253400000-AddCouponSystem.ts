import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCouponSystem1729253400000 implements MigrationInterface {
  name = 'AddCouponSystem1729253400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create promo_codes table
    await queryRunner.query(`
      CREATE TYPE "promo_type_enum" AS ENUM ('single_use', 'multi_use', 'unlimited')
    `);

    await queryRunner.query(`
      CREATE TABLE "promo_codes" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "code" varchar(100) NOT NULL UNIQUE,
        "description" text,
        "type" promo_type_enum NOT NULL DEFAULT 'multi_use',
        "createdBy" varchar(255),
        "maxUses" int,
        "usedCount" int NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "expiresAt" timestamptz,
        "couponConfig" jsonb,
        "metadata" jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_promo_codes_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_promo_codes_code" ON "promo_codes" ("code")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_promo_codes_isActive" ON "promo_codes" ("isActive")
    `);

    // Create coupon_grants table
    await queryRunner.query(`
      CREATE TYPE "coupon_type_enum" AS ENUM ('percent_off', 'fixed_price', 'fixed_amount', 'free_item')
    `);

    await queryRunner.query(`
      CREATE TYPE "coupon_status_enum" AS ENUM ('active', 'redeemed', 'expired', 'cancelled')
    `);

    await queryRunner.query(`
      CREATE TABLE "coupon_grants" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "promoCodeId" uuid,
        "type" coupon_type_enum NOT NULL,
        "label" varchar(255) NOT NULL,
        "description" text,
        "valueCents" int,
        "percentOff" int,
        "priceOverrideCents" int,
        "eligibleItems" jsonb,
        "channels" varchar(50) NOT NULL DEFAULT 'both',
        "expiresAt" timestamptz NOT NULL,
        "redeemedAt" timestamptz,
        "redeemedOrderId" uuid,
        "status" coupon_status_enum NOT NULL DEFAULT 'active',
        "source" varchar(100) NOT NULL,
        "metadata" jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_coupon_grants_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_coupon_grants_promoCodeId" FOREIGN KEY ("promoCodeId") REFERENCES "promo_codes"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_coupon_grants_userId_status" ON "coupon_grants" ("userId", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_coupon_grants_status_expiresAt" ON "coupon_grants" ("status", "expiresAt")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_coupon_grants_promoCodeId" ON "coupon_grants" ("promoCodeId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop coupon_grants table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_coupon_grants_promoCodeId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_coupon_grants_status_expiresAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_coupon_grants_userId_status"`);
    await queryRunner.query(`DROP TABLE "coupon_grants"`);
    await queryRunner.query(`DROP TYPE "coupon_status_enum"`);
    await queryRunner.query(`DROP TYPE "coupon_type_enum"`);

    // Drop promo_codes table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_promo_codes_isActive"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_promo_codes_code"`);
    await queryRunner.query(`DROP TABLE "promo_codes"`);
    await queryRunner.query(`DROP TYPE "promo_type_enum"`);
  }
}
