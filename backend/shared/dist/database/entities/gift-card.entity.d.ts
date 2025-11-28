import { User } from './user.entity';
export declare class GiftCard {
    giftCardId: string;
    code: string;
    purchasedByUserId: string | null;
    redeemedByUserId: string | null;
    initialBalance: number;
    currentBalance: number;
    purchasedAt: Date | null;
    redeemedAt: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    purchasedByUser: User;
    redeemedByUser: User;
}
