import { User } from './user.entity';
import { Store } from './store.entity';
import { OrderItem } from './order-item.entity';
import { CouponGrant } from './coupon-grant.entity';
export declare enum OrderStatus {
    INITIATED = "initiated",
    SLOT_RESERVED = "slot_reserved",
    PAYMENT_PROCESSING = "payment_processing",
    PAYMENT_FAILED = "payment_failed",
    CONFIRMED = "confirmed",
    IN_PROGRESS = "in_progress",
    READY = "ready",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    REFUNDED = "refunded"
}
export declare enum OrderType {
    PICKUP = "pickup",
    DELIVERY = "delivery",
    CATERING = "catering"
}
export declare enum PaymentMethod {
    STRIPE = "stripe",
    APPLE_PAY = "apple_pay",
    GOOGLE_PAY = "google_pay",
    REWARD_REDEMPTION = "reward_redemption"
}
export declare class Order {
    id: string;
    userId: string;
    storeId: string;
    orderType: OrderType;
    status: OrderStatus;
    toastOrderId: string | null;
    toastCheckId: string | null;
    subtotal: number;
    tax: number;
    tip: number;
    deliveryFee: number;
    discountAmount: number;
    appliedCouponId: string | null;
    total: number;
    paymentMethod: PaymentMethod | null;
    stripePaymentIntentId: string | null;
    pointsEarned: number;
    pointsRedeemed: number;
    pickupTime: Date | null;
    specialInstructions: string | null;
    deliveryInfo: Record<string, any> | null;
    completedAt: Date | null;
    cancelledAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    store: Store;
    items: OrderItem[];
    appliedCoupon: CouponGrant | null;
    get totalAmount(): number;
    get promoCodeId(): string | null;
}
