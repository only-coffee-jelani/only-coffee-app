import { User } from './user.entity';
export declare enum ProgramEventType {
    COUPON_GRANTED = "coupon_granted",
    COUPON_REDEEMED = "coupon_redeemed",
    COUPON_EXPIRED = "coupon_expired",
    PROMO_CODE_REDEEMED = "promo_code_redeemed"
}
export declare class ProgramEvent {
    id: string;
    userId: string | null;
    eventType: ProgramEventType;
    couponId: string | null;
    orderId: string | null;
    promoCodeId: string | null;
    eventData: Record<string, any> | null;
    createdAt: Date;
    user: User | null;
}
