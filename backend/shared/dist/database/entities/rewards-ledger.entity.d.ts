import { User } from './user.entity';
export declare enum RewardTransactionType {
    EARNED = "earned",
    REDEEMED = "redeemed",
    EXPIRED = "expired",
    ADJUSTED = "adjusted",
    BIRTHDAY_BONUS = "birthday_bonus"
}
export declare class RewardsLedger {
    id: string;
    userId: string;
    orderId: string | null;
    transactionType: RewardTransactionType;
    points: number;
    balanceAfter: number;
    orderAmount: number | null;
    description: string | null;
    metadata: Record<string, any> | null;
    expiresAt: Date | null;
    createdAt: Date;
    user: User;
}
