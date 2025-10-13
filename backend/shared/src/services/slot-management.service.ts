import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_KEYS, REDIS_TTL, getRedisConfig } from '../config';

export interface TimeSlot {
  time: string;
  available: number;
  total: number;
  isAvailable: boolean;
}

@Injectable()
export class SlotManagementService {
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis(getRedisConfig());
  }

  /**
   * Get available pickup slots for a store on a specific date
   */
  async getAvailableSlots(
    storeId: string,
    date: Date,
    storeCapacity: number,
  ): Promise<TimeSlot[]> {
    const dateStr = date.toISOString().split('T')[0];
    const slots: TimeSlot[] = [];

    // Generate slots from 6 AM to 8 PM in 5-minute intervals
    const startHour = 6;
    const endHour = 20;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const slotKey = REDIS_KEYS.SLOT_CAPACITY(storeId, `${dateStr}T${timeStr}`);

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

  /**
   * Reserve a slot for an order (with 10-minute hold)
   */
  async reserveSlot(
    orderId: string,
    storeId: string,
    pickupTime: Date,
    storeCapacity: number,
  ): Promise<boolean> {
    const slotKey = REDIS_KEYS.SLOT_CAPACITY(storeId, pickupTime.toISOString());
    const reservationKey = REDIS_KEYS.SLOT_RESERVATION(orderId);

    // Check capacity
    const reserved = (await this.redis.get(slotKey)) || '0';
    if (parseInt(reserved, 10) >= storeCapacity) {
      return false;
    }

    // Reserve the slot
    await this.redis
      .multi()
      .incr(slotKey)
      .expire(slotKey, REDIS_TTL.SLOT_CACHE)
      .set(reservationKey, pickupTime.toISOString())
      .expire(reservationKey, REDIS_TTL.SLOT_RESERVATION)
      .exec();

    return true;
  }

  /**
   * Confirm a slot reservation (remove hold, permanent reservation)
   */
  async confirmSlot(orderId: string): Promise<void> {
    const reservationKey = REDIS_KEYS.SLOT_RESERVATION(orderId);
    await this.redis.del(reservationKey);
  }

  /**
   * Release a slot (on order cancellation or timeout)
   */
  async releaseSlot(orderId: string, storeId: string, pickupTime: Date): Promise<void> {
    const slotKey = REDIS_KEYS.SLOT_CAPACITY(storeId, pickupTime.toISOString());
    const reservationKey = REDIS_KEYS.SLOT_RESERVATION(orderId);

    await this.redis
      .multi()
      .decr(slotKey)
      .del(reservationKey)
      .exec();
  }

  /**
   * Get ASAP pickup time (next available slot)
   */
  async getAsapPickupTime(storeId: string, storeCapacity: number): Promise<Date | null> {
    const now = new Date();
    const prepTime = 8; // 8 minutes preparation time

    // Start checking from current time + prep time
    const checkTime = new Date(now.getTime() + prepTime * 60000);

    // Round to next 5-minute interval
    const minutes = checkTime.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 5) * 5;
    checkTime.setMinutes(roundedMinutes, 0, 0);

    // Check next 12 slots (1 hour)
    for (let i = 0; i < 12; i++) {
      const slotTime = new Date(checkTime.getTime() + i * 5 * 60000);
      const slotKey = REDIS_KEYS.SLOT_CAPACITY(storeId, slotTime.toISOString());

      const reserved = (await this.redis.get(slotKey)) || '0';
      if (parseInt(reserved, 10) < storeCapacity) {
        return slotTime;
      }
    }

    return null; // No slots available in next hour
  }

  /**
   * Clean up expired slot reservations (run periodically)
   */
  async cleanupExpiredReservations(): Promise<void> {
    const pattern = REDIS_KEYS.SLOT_RESERVATION('*');
    const keys = await this.redis.keys(pattern);

    for (const key of keys) {
      const ttl = await this.redis.ttl(key);
      if (ttl === -1) {
        // No TTL set, delete it
        await this.redis.del(key);
      }
    }
  }
}
