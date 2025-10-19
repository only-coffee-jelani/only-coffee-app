import { User } from './user.entity';
export declare class UserStreak {
    id: string;
    userId: string;
    consecutiveDays: number;
    currentStreak: number;
    longestStreak: number;
    lastVisitDate: Date | null;
    firstQualifyingPurchaseDate: Date | null;
    streakStartDate: Date | null;
    monthlyPoints: number;
    tierXP: number;
    monthlyVisits: number;
    annualSpend: number;
    sevenDayStreakCount: number;
    lastMonthlyReset: Date | null;
    createdAt: Date;
    updatedAt: Date;
    user: User;
}
