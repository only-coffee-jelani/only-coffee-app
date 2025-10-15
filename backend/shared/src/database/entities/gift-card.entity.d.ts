export declare enum GiftCardType {
    AMOUNT = "amount",
    FREE_COFFEE = "free_coffee"
}
export declare enum GiftCardStatus {
    PENDING = "pending",
    ACTIVE = "active",
    REDEEMED = "redeemed",
    EXPIRED = "expired",
    CANCELLED = "cancelled"
}
export declare class GiftCard {
    id: string;
    code: string;
    type: GiftCardType;
    status: GiftCardStatus;
    senderUserId: string;
    recipientUserId: string | null;
    recipientEmail: string | null;
    recipientPhone: string | null;
    amount: number | null;
    remainingBalance: number | null;
    maxRedeemValue: number | null;
    message: string | null;
    stripePaymentIntentId: string | null;
    redeemedAt: Date | null;
    redeemedOrderId: string | null;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
