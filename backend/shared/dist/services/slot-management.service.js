"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlotManagementService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
const config_2 = require("../config");
let SlotManagementService = class SlotManagementService {
    constructor(configService) {
        this.configService = configService;
        this.redisAvailable = false;
        this.redis = new ioredis_1.default((0, config_2.getRedisConfig)());
        this.redis.on('connect', () => {
            console.log('[SlotManagementService] Redis connected');
            this.redisAvailable = true;
        });
        this.redis.on('error', (err) => {
            console.warn('[SlotManagementService] Redis connection error:', err.message);
            this.redisAvailable = false;
        });
        this.redis.on('close', () => {
            console.warn('[SlotManagementService] Redis connection closed');
            this.redisAvailable = false;
        });
    }
    async getAvailableSlots(storeId, date, storeCapacity) {
        const dateStr = date.toISOString().split('T')[0];
        const slots = [];
        const startHour = 6;
        const endHour = 20;
        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += 5) {
                const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const slotKey = config_2.REDIS_KEYS.SLOT_CAPACITY(storeId, `${dateStr}T${timeStr}`);
                const reserved = (await this.redis.get(slotKey)) || '0';
                const available = storeCapacity - parseInt(reserved, 10);
                slots.push({
                    time: timeStr,
                    available,
                    total: storeCapacity,
                    isAvailable: available > 0,
                });
            }
        }
        return slots;
    }
    async reserveSlot(orderId, storeId, pickupTime, storeCapacity) {
        if (!this.redisAvailable) {
            console.warn('[SlotManagementService] Redis unavailable, allowing slot reservation');
            return true;
        }
        try {
            const slotKey = config_2.REDIS_KEYS.SLOT_CAPACITY(storeId, pickupTime.toISOString());
            const reservationKey = config_2.REDIS_KEYS.SLOT_RESERVATION(orderId);
            const reserved = (await this.redis.get(slotKey)) || '0';
            if (parseInt(reserved, 10) >= storeCapacity) {
                return false;
            }
            await this.redis
                .multi()
                .incr(slotKey)
                .expire(slotKey, config_2.REDIS_TTL.SLOT_CACHE)
                .set(reservationKey, pickupTime.toISOString())
                .expire(reservationKey, config_2.REDIS_TTL.SLOT_RESERVATION)
                .exec();
            return true;
        }
        catch (error) {
            console.warn('[SlotManagementService] Redis error, allowing slot reservation:', error.message);
            this.redisAvailable = false;
            return true;
        }
    }
    async confirmSlot(orderId) {
        const reservationKey = config_2.REDIS_KEYS.SLOT_RESERVATION(orderId);
        await this.redis.del(reservationKey);
    }
    async releaseSlot(orderId, storeId, pickupTime) {
        const slotKey = config_2.REDIS_KEYS.SLOT_CAPACITY(storeId, pickupTime.toISOString());
        const reservationKey = config_2.REDIS_KEYS.SLOT_RESERVATION(orderId);
        await this.redis
            .multi()
            .decr(slotKey)
            .del(reservationKey)
            .exec();
    }
    async getAsapPickupTime(storeId, storeCapacity) {
        const now = new Date();
        const prepTime = 8;
        const checkTime = new Date(now.getTime() + prepTime * 60000);
        const minutes = checkTime.getMinutes();
        const roundedMinutes = Math.ceil(minutes / 5) * 5;
        checkTime.setMinutes(roundedMinutes, 0, 0);
        if (!this.redisAvailable) {
            console.warn('[SlotManagementService] Redis unavailable, using default ASAP time');
            return checkTime;
        }
        try {
            for (let i = 0; i < 12; i++) {
                const slotTime = new Date(checkTime.getTime() + i * 5 * 60000);
                const slotKey = config_2.REDIS_KEYS.SLOT_CAPACITY(storeId, slotTime.toISOString());
                const reserved = (await this.redis.get(slotKey)) || '0';
                if (parseInt(reserved, 10) < storeCapacity) {
                    return slotTime;
                }
            }
            return null;
        }
        catch (error) {
            console.warn('[SlotManagementService] Redis error, using default ASAP time:', error.message);
            this.redisAvailable = false;
            return checkTime;
        }
    }
    async cleanupExpiredReservations() {
        const pattern = config_2.REDIS_KEYS.SLOT_RESERVATION('*');
        const keys = await this.redis.keys(pattern);
        for (const key of keys) {
            const ttl = await this.redis.ttl(key);
            if (ttl === -1) {
                await this.redis.del(key);
            }
        }
    }
};
exports.SlotManagementService = SlotManagementService;
exports.SlotManagementService = SlotManagementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SlotManagementService);
//# sourceMappingURL=slot-management.service.js.map