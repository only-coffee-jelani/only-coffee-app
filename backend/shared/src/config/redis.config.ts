import { RedisOptions } from 'ioredis';

export const getRedisConfig = (): RedisOptions => {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'only-coffee:',
    retryStrategy: (times: number) => {
      // Stop retrying after 3 attempts for development
      if (times > 3) {
        return null;
      }
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: false, // Disable ready check for development
    enableOfflineQueue: false, // Disable offline queue to fail fast
    lazyConnect: true, // Don't connect immediately - allow app to start without Redis
  };
};

export const REDIS_KEYS = {
  // Session keys
  SESSION: (sessionId: string) => `session:${sessionId}`,
  USER_SESSION: (userId: string) => `user:${userId}:session`,

  // Cache keys
  MENU_ITEMS: (storeId: string) => `menu:${storeId}:items`,
  STORE_INFO: (storeId: string) => `store:${storeId}:info`,
  USER_PROFILE: (userId: string) => `user:${userId}:profile`,
  USER_ORDERS: (userId: string, limit: number) => `user:${userId}:orders:${limit}`,

  // Slot management keys
  PICKUP_SLOTS: (storeId: string, date: string) => `slots:${storeId}:${date}`,
  SLOT_CAPACITY: (storeId: string, slotTime: string) => `slot:${storeId}:${slotTime}:capacity`,
  SLOT_RESERVATION: (orderId: string) => `slot:reservation:${orderId}`,

  // Rate limiting keys
  RATE_LIMIT: (identifier: string) => `ratelimit:${identifier}`,

  // Lock keys
  LOCK: (resource: string) => `lock:${resource}`,
} as const;

export const REDIS_TTL = {
  SESSION: 86400, // 24 hours
  MENU_CACHE: 300, // 5 minutes
  STORE_CACHE: 3600, // 1 hour
  USER_CACHE: 300, // 5 minutes
  SLOT_CACHE: 30, // 30 seconds
  SLOT_RESERVATION: 600, // 10 minutes
  RATE_LIMIT: 60, // 1 minute
} as const;
