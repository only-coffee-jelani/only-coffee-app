import { User } from './user.entity';
import { CouponGrant } from './coupon-grant.entity';
export declare enum AnniversaryBadge {
    YEAR_1 = "year_1_anniversary",
    YEAR_2 = "year_2_anniversary",
    YEAR_3 = "year_3_anniversary",
    YEAR_5 = "year_5_anniversary",
    YEAR_10 = "year_10_anniversary"
}
export declare class AnniversaryReward {
    id: string;
    userId: string;
    anniversaryYear: number;
    anniversaryDate: Date;
    isGranted: boolean;
    grantedAt: Date | null;
    couponId: string | null;
    badgeAwarded: AnniversaryBadge | null;
    isRedeemed: boolean;
    redeemedAt: Date | null;
    customMessage: string | null;
    metadata: Record<string, any> | null;
    createdAt: Date;
    user: User;
    coupon: CouponGrant | null;
}
