import { User } from './user.entity';
export declare enum ProgramEventType {
    COUPON_GRANTED = "COUPON_GRANTED",
    COUPON_REDEEMED = "COUPON_REDEEMED",
    COUPON_EXPIRED = "COUPON_EXPIRED",
    PROMO_CODE_REDEEMED = "PROMO_CODE_REDEEMED",
    PROMO_CODE_USED = "PROMO_CODE_USED",
    ORDER_PLACED = "ORDER_PLACED"
}
export declare class ProgramEvent {
    eventId: string;
    userId: string | null;
    eventType: ProgramEventType;
    couponId: string | null;
    orderId: string | null;
    promoCodeId: string | null;
    eventData: Record<string, any> | null;
    createdAt: Date;
    user: User | null;
}
