import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1701388800000 implements MigrationInterface {
  name = 'InitialSchema1701388800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create user_tier enum
    await queryRunner.query(`
      CREATE TYPE "user_tier_enum" AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'black')
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" varchar(255) NOT NULL,
        "phone" varchar(20),
        "firstName" varchar(255) NOT NULL,
        "lastName" varchar(255) NOT NULL,
        "passwordHash" varchar(255),
        "birthDate" date,
        "role" varchar(20) NOT NULL DEFAULT 'customer',
        "loyaltyTier" user_tier_enum NOT NULL DEFAULT 'bronze',
        "loyaltyPoints" int NOT NULL DEFAULT 0,
        "preferences" jsonb NOT NULL DEFAULT '{}',
        "isActive" boolean NOT NULL DEFAULT true,
        "emailVerified" boolean NOT NULL DEFAULT false,
        "phoneVerified" boolean NOT NULL DEFAULT false,
        "auth0Id" varchar(255),
        "stripeCustomerId" varchar(255),
        "lastLoginAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "UQ_users_phone" UNIQUE ("phone")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_phone" ON "users" ("phone")`);

    // Create stores table
    await queryRunner.query(`
      CREATE TABLE "stores" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(255) NOT NULL,
        "type" varchar(20) NOT NULL DEFAULT 'store',
        "toastLocationId" varchar(255),
        "address" varchar(500) NOT NULL,
        "city" varchar(100) NOT NULL,
        "state" varchar(50) NOT NULL,
        "zipCode" varchar(20) NOT NULL,
        "latitude" decimal(10,7) NOT NULL,
        "longitude" decimal(10,7) NOT NULL,
        "phone" varchar(20),
        "email" varchar(255),
        "operatingHours" jsonb NOT NULL DEFAULT '{}',
        "capacity" int NOT NULL DEFAULT 20,
        "isActive" boolean NOT NULL DEFAULT true,
        "acceptingOrders" boolean NOT NULL DEFAULT true,
        "averageRating" decimal(3,2) NOT NULL DEFAULT 4.5,
        "totalReviews" int NOT NULL DEFAULT 0,
        "features" jsonb NOT NULL DEFAULT '{}',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_stores_location" ON "stores" ("latitude", "longitude")`,
    );

    // Create orders table (partitioned by created_at)
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "orderType" varchar(20) NOT NULL DEFAULT 'pickup',
        "status" varchar(50) NOT NULL DEFAULT 'initiated',
        "toastOrderId" varchar(255),
        "toastCheckId" varchar(255),
        "subtotal" decimal(10,2) NOT NULL,
        "tax" decimal(10,2) NOT NULL DEFAULT 0,
        "tip" decimal(10,2) NOT NULL DEFAULT 0,
        "deliveryFee" decimal(10,2) NOT NULL DEFAULT 0,
        "total" decimal(10,2) NOT NULL,
        "paymentMethod" varchar(50),
        "stripePaymentIntentId" varchar(255),
        "pointsEarned" int NOT NULL DEFAULT 0,
        "pointsRedeemed" int NOT NULL DEFAULT 0,
        "pickupTime" timestamptz,
        "specialInstructions" varchar(500),
        "deliveryInfo" jsonb,
        "completedAt" timestamptz,
        "cancelledAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("id", "createdAt")
      ) PARTITION BY RANGE ("createdAt")
    `);

    // Create initial partitions for orders (current and next 3 months)
    const now = new Date();
    for (let i = 0; i < 4; i++) {
      const partitionDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const nextPartitionDate = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
      const partitionName = `orders_${partitionDate.getFullYear()}_${String(partitionDate.getMonth() + 1).padStart(2, '0')}`;

      await queryRunner.query(`
        CREATE TABLE "${partitionName}" PARTITION OF "orders"
        FOR VALUES FROM ('${partitionDate.toISOString()}') TO ('${nextPartitionDate.toISOString()}')
      `);
    }

    await queryRunner.query(`CREATE INDEX "IDX_orders_userId" ON "orders" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_storeId" ON "orders" ("storeId")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_status" ON "orders" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_pickupTime" ON "orders" ("pickupTime")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_orders_userId_createdAt" ON "orders" ("userId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_orders_storeId_createdAt" ON "orders" ("storeId", "createdAt")`,
    );

    // Create order_items table
    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "orderId" uuid NOT NULL,
        "menuItemId" uuid,
        "itemName" varchar(255) NOT NULL,
        "toastItemId" varchar(255),
        "quantity" int NOT NULL DEFAULT 1,
        "basePrice" decimal(10,2) NOT NULL,
        "modifiersPrice" decimal(10,2) NOT NULL DEFAULT 0,
        "totalPrice" decimal(10,2) NOT NULL,
        "modifiers" jsonb NOT NULL DEFAULT '[]',
        "specialInstructions" text
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_order_items_orderId" ON "order_items" ("orderId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_order_items_menuItemId" ON "order_items" ("menuItemId")`,
    );

    // Create menu_items table
    await queryRunner.query(`
      CREATE TABLE "menu_items" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "storeId" uuid NOT NULL,
        "toastItemId" varchar(255),
        "name" varchar(255) NOT NULL,
        "description" text,
        "category" varchar(50) NOT NULL,
        "basePrice" decimal(10,2) NOT NULL,
        "imageUrl" varchar(500),
        "availableModifiers" jsonb NOT NULL DEFAULT '[]',
        "nutritionalInfo" jsonb NOT NULL DEFAULT '{}',
        "allergens" jsonb NOT NULL DEFAULT '[]',
        "isAvailable" boolean NOT NULL DEFAULT true,
        "isActive" boolean NOT NULL DEFAULT true,
        "preparationTime" int NOT NULL DEFAULT 0,
        "sortOrder" int NOT NULL DEFAULT 999,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "lastSyncedAt" timestamptz
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_menu_items_storeId" ON "menu_items" ("storeId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_menu_items_category" ON "menu_items" ("category")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_menu_items_toastItemId" ON "menu_items" ("toastItemId")`,
    );

    // Create rewards_ledger table (partitioned by created_at)
    await queryRunner.query(`
      CREATE TABLE "rewards_ledger" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "orderId" uuid,
        "transactionType" varchar(50) NOT NULL,
        "points" int NOT NULL,
        "balanceAfter" int NOT NULL,
        "orderAmount" decimal(10,2),
        "description" varchar(500),
        "metadata" jsonb,
        "expiresAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("id", "createdAt")
      ) PARTITION BY RANGE ("createdAt")
    `);

    // Create initial partitions for rewards_ledger
    for (let i = 0; i < 4; i++) {
      const partitionDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const nextPartitionDate = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
      const partitionName = `rewards_ledger_${partitionDate.getFullYear()}_${String(partitionDate.getMonth() + 1).padStart(2, '0')}`;

      await queryRunner.query(`
        CREATE TABLE "${partitionName}" PARTITION OF "rewards_ledger"
        FOR VALUES FROM ('${partitionDate.toISOString()}') TO ('${nextPartitionDate.toISOString()}')
      `);
    }

    await queryRunner.query(
      `CREATE INDEX "IDX_rewards_ledger_userId" ON "rewards_ledger" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_rewards_ledger_transactionType" ON "rewards_ledger" ("transactionType")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_rewards_ledger_userId_createdAt" ON "rewards_ledger" ("userId", "createdAt")`,
    );

    // Create gift_cards table
    await queryRunner.query(`
      CREATE TABLE "gift_cards" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "code" varchar(32) NOT NULL UNIQUE,
        "type" varchar(20) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "senderUserId" uuid NOT NULL,
        "recipientUserId" uuid,
        "recipientEmail" varchar(255),
        "recipientPhone" varchar(20),
        "amount" decimal(10,2),
        "remainingBalance" decimal(10,2),
        "maxRedeemValue" decimal(10,2),
        "message" text,
        "stripePaymentIntentId" varchar(255),
        "redeemedAt" timestamptz,
        "redeemedOrderId" uuid,
        "expiresAt" timestamptz NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_gift_cards_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_gift_cards_code" ON "gift_cards" ("code")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_gift_cards_senderUserId" ON "gift_cards" ("senderUserId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_gift_cards_recipientUserId" ON "gift_cards" ("recipientUserId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_gift_cards_status" ON "gift_cards" ("status")`,
    );

    // Create delivery_orders table
    await queryRunner.query(`
      CREATE TABLE "delivery_orders" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "orderId" uuid NOT NULL,
        "provider" varchar(50) NOT NULL,
        "status" varchar(50) NOT NULL DEFAULT 'pending',
        "externalDeliveryId" varchar(255),
        "pickupAddress" varchar(500) NOT NULL,
        "deliveryAddress" varchar(500) NOT NULL,
        "pickupLatitude" decimal(10,7) NOT NULL,
        "pickupLongitude" decimal(10,7) NOT NULL,
        "deliveryLatitude" decimal(10,7) NOT NULL,
        "deliveryLongitude" decimal(10,7) NOT NULL,
        "recipientName" varchar(255),
        "recipientPhone" varchar(20),
        "deliveryFee" decimal(10,2) NOT NULL,
        "quotedFee" decimal(10,2),
        "estimatedDurationMinutes" int,
        "estimatedDeliveryTime" timestamptz,
        "courierName" varchar(255),
        "courierPhone" varchar(20),
        "trackingUrl" varchar(500),
        "deliveryInstructions" text,
        "metadata" jsonb,
        "pickedUpAt" timestamptz,
        "deliveredAt" timestamptz,
        "cancelledAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_delivery_orders_orderId" ON "delivery_orders" ("orderId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_delivery_orders_provider" ON "delivery_orders" ("provider")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_delivery_orders_status" ON "delivery_orders" ("status")`,
    );

    // Create reviews table
    await queryRunner.query(`
      CREATE TABLE "reviews" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "orderId" uuid,
        "rating" int NOT NULL,
        "comment" text,
        "images" jsonb NOT NULL DEFAULT '[]',
        "isVerifiedPurchase" boolean NOT NULL DEFAULT false,
        "isVisible" boolean NOT NULL DEFAULT true,
        "helpfulCount" int NOT NULL DEFAULT 0,
        "responseText" varchar(255),
        "responseAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_reviews_rating" CHECK ("rating" >= 1 AND "rating" <= 5)
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_reviews_userId" ON "reviews" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_reviews_storeId" ON "reviews" ("storeId")`);
    await queryRunner.query(`CREATE INDEX "IDX_reviews_orderId" ON "reviews" ("orderId")`);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD CONSTRAINT "FK_orders_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD CONSTRAINT "FK_orders_storeId" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "rewards_ledger"
      ADD CONSTRAINT "FK_rewards_ledger_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews"
      ADD CONSTRAINT "FK_reviews_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews"
      ADD CONSTRAINT "FK_reviews_storeId" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "delivery_orders" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "gift_cards" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rewards_ledger" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "menu_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stores" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "user_tier_enum"`);

    // Drop extension
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}
