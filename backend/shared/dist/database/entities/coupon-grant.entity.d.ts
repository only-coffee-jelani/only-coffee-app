import { User } from './user.entity';
import { PromoCode } from './promo-code.entity';
export declare enum CouponType {
    PERCENT_OFF = "percent_off",
    FIXED_PRICE = "fixed_price",
    FIXED_AMOUNT = "fixed_amount",
    FREE_ITEM = "free_item"
}
export declare enum CouponStatus {
    ACTIVE = "active",
    REDEEMED = "redeemed",
    EXPIRED = "expired",
    CANCELLED = "cancelled"
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
    promoCode: PromoCode | null;
}
