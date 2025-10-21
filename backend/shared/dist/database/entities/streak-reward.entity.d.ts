import { CouponType } from './coupon-grant.entity';
export declare enum RewardType {
    COUPON_GRANT = "coupon_grant",
    POINTS_GRANT = "points_grant"
}
export declare class StreakReward {
    id: string;
    streakDay: number;
    rewardType: RewardType;
    couponType: CouponType;
    label: string;
    description: string | null;
    valueCents: number | null;
    maxValueCents: number | null;
    expiryDays: number;
    channels: string;
    eligibleItems: Record<string, any> | null;
    isActive: boolean;
    displayOrder: number;
    metadata: Record<string, any> | null;
    createdAt: Date;
    updatedAt: Date;
}
