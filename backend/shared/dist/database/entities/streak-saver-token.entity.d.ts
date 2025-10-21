import { User } from './user.entity';
export declare enum TokenStatus {
    AVAILABLE = "available",
    USED = "used",
    EXPIRED = "expired"
}
export declare class StreakSaverToken {
    id: string;
    userId: string;
    status: TokenStatus;
    grantedAt: Date;
    usedAt: Date | null;
    appliedToDate: Date | null;
    expiresAt: Date | null;
    metadata: Record<string, any> | null;
    createdAt: Date;
    user: User;
}
