import { CouponGrant } from './coupon-grant.entity';
export declare enum PromoType {
    SINGLE_USE = "single_use",
    MULTI_USE = "multi_use",
    UNLIMITED = "unlimited"
}
export declare class PromoCode {
    id: string;
    code: string;
    description: string | null;
    type: PromoType;
    createdBy: string | null;
    maxUses: number | null;
    usedCount: number;
    isActive: boolean;
    expiresAt: Date | null;
    couponConfig: Record<string, any> | null;
    metadata: Record<string, any> | null;
    createdAt: Date;
    updatedAt: Date;
    coupons: CouponGrant[];
}
