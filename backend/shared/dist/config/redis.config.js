"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REDIS_TTL = exports.REDIS_KEYS = exports.getRedisConfig = void 0;
const getRedisConfig = () => {
    return {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || 'redis_password',
        db: parseInt(process.env.REDIS_DB || '0', 10),
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'only-coffee:',
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: true,
        lazyConnect: false,
    };
};
exports.getRedisConfig = getRedisConfig;
exports.REDIS_KEYS = {
    SESSION: (sessionId) => `session:${sessionId}`,
    USER_SESSION: (userId) => `user:${userId}:session`,
    MENU_ITEMS: (storeId) => `menu:${storeId}:items`,
    STORE_INFO: (storeId) => `store:${storeId}:info`,
    USER_PROFILE: (userId) => `user:${userId}:profile`,
    USER_ORDERS: (userId, limit) => `user:${userId}:orders:${limit}`,
    PICKUP_SLOTS: (storeId, date) => `slots:${storeId}:${date}`,
    SLOT_CAPACITY: (storeId, slotTime) => `slot:${storeId}:${slotTime}:capacity`,
    SLOT_RESERVATION: (orderId) => `slot:reservation:${orderId}`,
    RATE_LIMIT: (identifier) => `ratelimit:${identifier}`,
    LOCK: (resource) => `lock:${resource}`,
};
exports.REDIS_TTL = {
    SESSION: 86400,
    MENU_CACHE: 300,
    STORE_CACHE: 3600,
    USER_CACHE: 300,
    SLOT_CACHE: 30,
    SLOT_RESERVATION: 600,
    RATE_LIMIT: 60,
};
//# sourceMappingURL=redis.config.js.map