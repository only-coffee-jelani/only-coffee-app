import { User } from './user.entity';
export declare enum CouponType {
    PERCENT_OFF = "PERCENT_OFF",
    FIXED_AMOUNT = "FIXED_AMOUNT",
    FIXED_PRICE = "FIXED_PRICE",
    FREE_ITEM = "FREE_ITEM"
}
export declare enum CouponStatus {
    ACTIVE = "ACTIVE",
    REDEEMED = "REDEEMED",
    EXPIRED = "EXPIRED",
    CANCELLED = "CANCELLED"
}
export declare class CouponGrant {
    id: string;
    userId: string;
    promoCodeId: string | null;
    type: CouponType;
    label: string;
    description: string | null;
    valueCents: number | null;
    percentOff: number | null;
    priceOverrideCents: number | null;
    eligibleItems: Record<string, any> | null;
    channels: string;
    expiresAt: Date;
    redeemedAt: Date | null;
    redeemedOrderId: string | null;
    status: CouponStatus;
    source: string;
    metadata: Record<string, any> | null;
    createdAt: Date;
    user: User;
}
