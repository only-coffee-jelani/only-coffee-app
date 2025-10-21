import { User, UserTier } from './user.entity';
export declare enum TierChangeReason {
    QUALIFIED = "qualified",
    DOWNGRADED = "downgraded",
    MANUAL_OVERRIDE = "manual_override",
    INITIAL_SETUP = "initial_setup"
}
export declare class UserTierHistory {
    id: string;
    userId: string;
    previousTier: UserTier | null;
    newTier: UserTier;
    reason: TierChangeReason;
    changedAt: Date;
    monthlyVisitsAtChange: number | null;
    tierXPAtChange: number | null;
    annualSpendAtChange: number | null;
    sevenDayStreakCountAtChange: number | null;
    adminNotes: string | null;
    metadata: Record<string, any> | null;
    createdAt: Date;
    user: User;
}
