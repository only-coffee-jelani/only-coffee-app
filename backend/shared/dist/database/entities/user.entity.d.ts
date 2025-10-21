import { Order } from './order.entity';
import { RewardsLedger } from './rewards-ledger.entity';
import { Review } from './review.entity';
export declare enum UserRole {
    CUSTOMER = "customer",
    STORE_STAFF = "store_staff",
    ADMIN = "admin"
}
export declare enum UserTier {
    BRONZE = "bronze",
    SILVER = "silver",
    GOLD = "gold",
    PLATINUM = "platinum",
    BLACK = "black"
}
export declare class User {
    id: string;
    email: string;
    phone: string | null;
    firstName: string;
    lastName: string;
    passwordHash: string | null;
    birthDate: Date | null;
    role: UserRole;
    loyaltyTier: UserTier;
    loyaltyPoints: number;
    preferences: Record<string, any>;
    isActive: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    marketingOptIn: boolean;
    verificationCode: string | null;
    verificationCodeExpiry: Date | null;
    auth0Id: string | null;
    stripeCustomerId: string | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    orders: Order[];
    rewardsLedger: RewardsLedger[];
    reviews: Review[];
}
