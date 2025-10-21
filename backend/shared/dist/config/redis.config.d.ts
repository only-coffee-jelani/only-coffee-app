import { RedisOptions } from 'ioredis';
export declare const getRedisConfig: () => RedisOptions;
export declare const REDIS_KEYS: {
    readonly SESSION: (sessionId: string) => string;
    readonly USER_SESSION: (userId: string) => string;
    readonly MENU_ITEMS: (storeId: string) => string;
    readonly STORE_INFO: (storeId: string) => string;
    readonly USER_PROFILE: (userId: string) => string;
    readonly USER_ORDERS: (userId: string, limit: number) => string;
    readonly PICKUP_SLOTS: (storeId: string, date: string) => string;
    readonly SLOT_CAPACITY: (storeId: string, slotTime: string) => string;
    readonly SLOT_RESERVATION: (orderId: string) => string;
    readonly RATE_LIMIT: (identifier: string) => string;
    readonly LOCK: (resource: string) => string;
};
export declare const REDIS_TTL: {
    readonly SESSION: 86400;
    readonly MENU_CACHE: 300;
    readonly STORE_CACHE: 3600;
    readonly USER_CACHE: 300;
    readonly SLOT_CACHE: 30;
    readonly SLOT_RESERVATION: 600;
    readonly RATE_LIMIT: 60;
};
