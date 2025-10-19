export declare enum DeliveryProvider {
    DOORDASH = "doordash",
    UBER_DIRECT = "uber_direct",
    GRUBHUB = "grubhub"
}
export declare enum DeliveryStatus {
    QUOTE_REQUESTED = "quote_requested",
    QUOTE_RECEIVED = "quote_received",
    PENDING = "pending",
    CONFIRMED = "confirmed",
    PICKUP_ASSIGNED = "pickup_assigned",
    PICKED_UP = "picked_up",
    EN_ROUTE = "en_route",
    DELIVERED = "delivered",
    CANCELLED = "cancelled",
    FAILED = "failed"
}
export declare class DeliveryOrder {
    id: string;
    orderId: string;
    provider: DeliveryProvider;
    status: DeliveryStatus;
    externalDeliveryId: string | null;
    pickupAddress: string;
    deliveryAddress: string;
    pickupLatitude: number;
    pickupLongitude: number;
    deliveryLatitude: number;
    deliveryLongitude: number;
    recipientName: string | null;
    recipientPhone: string | null;
    deliveryFee: number;
    quotedFee: number | null;
    estimatedDurationMinutes: number | null;
    estimatedDeliveryTime: Date | null;
    courierName: string | null;
    courierPhone: string | null;
    trackingUrl: string | null;
    deliveryInstructions: string | null;
    metadata: Record<string, any> | null;
    pickedUpAt: Date | null;
    deliveredAt: Date | null;
    cancelledAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
