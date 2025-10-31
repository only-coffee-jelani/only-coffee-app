/**
 * AWS Lambda Function: Kinesis Event Processor
 *
 * Processes user events from Kinesis Data Stream and:
 * 1. Updates user profiles in real-time
 * 2. Triggers AI promotion generation for high-value events
 * 3. Sends events to BigQuery for analytics
 *
 * Triggered by: AWS Kinesis Data Stream (only-coffee-user-events)
 * Memory: 256MB
 * Timeout: 60 seconds
 */

const { Pool } = require('pg');
const { BigQuery } = require('@google-cloud/bigquery');

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 5, // Lambda concurrent executions limit
});

// BigQuery client
const bigquery = new BigQuery({
  projectId: process.env.BIGQUERY_PROJECT_ID,
  keyFilename: process.env.BIGQUERY_KEY_FILE,
});
const dataset = bigquery.dataset(process.env.BIGQUERY_DATASET || 'user_events');
const table = dataset.table('events');

/**
 * Lambda handler
 */
exports.handler = async (event) => {
  console.log(`Processing ${event.Records.length} Kinesis records`);

  const results = {
    processed: 0,
    failed: 0,
    errors: [],
  };

  for (const record of event.Records) {
    try {
      // Decode Kinesis record
      const payload = Buffer.from(record.kinesis.data, 'base64').toString('utf-8');
      const userEvent = JSON.parse(payload);

      console.log(`Processing event: ${userEvent.eventType} for user ${userEvent.userId}`);

      // Process event in parallel
      await Promise.all([
        updateUserProfile(userEvent),
        sendToBigQuery(userEvent),
        checkPromotionTriggers(userEvent),
      ]);

      results.processed++;
    } catch (error) {
      console.error('Error processing record:', error);
      results.failed++;
      results.errors.push({
        recordId: record.recordId,
        error: error.message,
      });
    }
  }

  console.log(`Batch complete: ${results.processed} processed, ${results.failed} failed`);

  return {
    statusCode: 200,
    body: JSON.stringify(results),
  };
};

/**
 * Update user profile with event data
 */
async function updateUserProfile(event) {
  const client = await pool.connect();

  try {
    // Update last activity timestamp
    await client.query(
      `UPDATE user_profiles
       SET "lastActivityDate" = $1,
           "updatedAt" = NOW()
       WHERE "userId" = $2`,
      [new Date(event.timestamp), event.userId]
    );

    // Update event-specific metrics
    switch (event.eventType) {
      case 'purchase_completed':
        await handlePurchaseCompleted(client, event);
        break;

      case 'app_opened':
        await handleAppOpened(client, event);
        break;

      case 'cart_abandoned':
        await handleCartAbandoned(client, event);
        break;

      case 'streak_updated':
        await handleStreakUpdated(client, event);
        break;

      default:
        // Generic event count increment
        await client.query(
          `UPDATE user_profiles
           SET "totalEvents" = COALESCE("totalEvents", 0) + 1
           WHERE "userId" = $1`,
          [event.userId]
        );
    }

    console.log(`Updated profile for user ${event.userId}`);
  } finally {
    client.release();
  }
}

/**
 * Handle purchase completed event
 */
async function handlePurchaseCompleted(client, event) {
  const { totalAmount, items } = event.metadata || {};

  if (!totalAmount) return;

  await client.query(
    `UPDATE user_profiles
     SET "totalPurchases" = COALESCE("totalPurchases", 0) + 1,
         "lifetimeValue" = COALESCE("lifetimeValue", 0) + $1,
         "lastPurchaseDate" = $2,
         "avgOrderValue" = (COALESCE("lifetimeValue", 0) + $1) / (COALESCE("totalPurchases", 0) + 1),
         "updatedAt" = NOW()
     WHERE "userId" = $3`,
    [parseFloat(totalAmount), new Date(event.timestamp), event.userId]
  );

  // Update favorite items
  if (items && Array.isArray(items)) {
    const itemIds = items.map(item => item.menuItemId || item.itemId).filter(Boolean);

    if (itemIds.length > 0) {
      await client.query(
        `UPDATE user_profiles
         SET "favoriteItems" = COALESCE("favoriteItems", '[]'::jsonb) || $1::jsonb
         WHERE "userId" = $2`,
        [JSON.stringify(itemIds), event.userId]
      );
    }
  }
}

/**
 * Handle app opened event
 */
async function handleAppOpened(client, event) {
  await client.query(
    `UPDATE user_profiles
     SET "totalAppOpens" = COALESCE("totalAppOpens", 0) + 1,
         "lastActivityDate" = $1,
         "updatedAt" = NOW()
     WHERE "userId" = $2`,
    [new Date(event.timestamp), event.userId]
  );
}

/**
 * Handle cart abandoned event
 */
async function handleCartAbandoned(client, event) {
  await client.query(
    `UPDATE user_profiles
     SET "cartAbandonments" = COALESCE("cartAbandonments", 0) + 1,
         "updatedAt" = NOW()
     WHERE "userId" = $1`,
    [event.userId]
  );
}

/**
 * Handle streak updated event
 */
async function handleStreakUpdated(client, event) {
  const { currentStreak, longestStreak } = event.metadata || {};

  if (currentStreak !== undefined) {
    await client.query(
      `UPDATE user_profiles
       SET "currentStreak" = $1,
           "longestStreak" = GREATEST(COALESCE("longestStreak", 0), $2),
           "updatedAt" = NOW()
       WHERE "userId" = $3`,
      [currentStreak, longestStreak || currentStreak, event.userId]
    );
  }
}

/**
 * Send event to BigQuery for analytics
 */
async function sendToBigQuery(event) {
  try {
    const row = {
      event_id: event.eventId,
      user_id: event.userId,
      event_type: event.eventType,
      timestamp: new Date(event.timestamp).toISOString(),
      session_id: event.sessionId,
      device_type: event.deviceType,
      app_version: event.appVersion,
      store_id: event.storeId,
      latitude: event.location?.latitude,
      longitude: event.location?.longitude,
      metadata: JSON.stringify(event.metadata),
      streamed_at: new Date(event.streamedAt).toISOString(),
    };

    await table.insert([row]);
    console.log(`Sent event ${event.eventId} to BigQuery`);
  } catch (error) {
    // Log error but don't fail the entire batch
    console.error('BigQuery insert error:', error);
  }
}

/**
 * Check if event should trigger AI promotion generation
 */
async function checkPromotionTriggers(event) {
  const client = await pool.connect();

  try {
    // Define high-value trigger events
    const triggerEvents = [
      'purchase_completed',
      'cart_abandoned',
      'streak_milestone', // 7 day, 14 day, 30 day streaks
      'churn_risk_detected',
      'location_geofence_entered', // Near store
      'weather_promotion_triggered',
    ];

    if (!triggerEvents.includes(event.eventType)) {
      return; // Not a trigger event
    }

    // Check if user is eligible for promotion (frequency capping)
    const result = await client.query(
      `SELECT COUNT(*) as promotion_count
       FROM ai_promotions
       WHERE "userId" = $1
       AND "createdAt" > NOW() - INTERVAL '7 days'`,
      [event.userId]
    );

    const promotionCount = parseInt(result.rows[0].promotion_count, 10);

    // Frequency cap: max 2 promotions per week
    if (promotionCount >= 2) {
      console.log(`User ${event.userId} hit promotion frequency cap (${promotionCount}/week)`);
      return;
    }

    // Create AI promotion generation task
    await client.query(
      `INSERT INTO ai_promotions
       ("userId", "triggerEvent", "triggerMetadata", "status", "createdAt")
       VALUES ($1, $2, $3, 'pending_generation', NOW())`,
      [event.userId, event.eventType, event.metadata || {}]
    );

    console.log(`Queued AI promotion for user ${event.userId} (trigger: ${event.eventType})`);
  } finally {
    client.release();
  }
}

/**
 * Cleanup on Lambda shutdown
 */
process.on('exit', () => {
  pool.end();
});
