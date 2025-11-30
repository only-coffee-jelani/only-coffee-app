import { ConfigService } from '@nestjs/config';
export interface TimeSlot {
    time: string;
    available: number;
    total: number;
    isAvailable: boolean;
}
export declare class SlotManagementService {
    private readonly configService;
    private readonly redis;
    private redisAvailable;
    constructor(configService: ConfigService);
    getAvailableSlots(storeId: string, date: Date, storeCapacity: number): Promise<TimeSlot[]>;
    reserveSlot(orderId: string, storeId: string, pickupTime: Date, storeCapacity: number): Promise<boolean>;
    confirmSlot(orderId: string): Promise<void>;
    releaseSlot(orderId: string, storeId: string, pickupTime: Date): Promise<void>;
    getAsapPickupTime(storeId: string, storeCapacity: number): Promise<Date | null>;
    cleanupExpiredReservations(): Promise<void>;
}
