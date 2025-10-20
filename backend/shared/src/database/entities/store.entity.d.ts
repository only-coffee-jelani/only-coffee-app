import { Order } from './order.entity';
import { Review } from './review.entity';
export declare enum StoreType {
    COFFEE_SHOP = "coffee_shop",
    MOBILE_COFFEE_BAR = "mobile_coffee_bar"
}
export declare class Store {
    id: string;
    name: string;
    type: StoreType;
    toastLocationId: string | null;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    latitude: number;
    longitude: number;
    phone: string | null;
    email: string | null;
    operatingHours: Record<string, any>;
    capacity: number;
    isActive: boolean;
    acceptingOrders: boolean;
    averageRating: number;
    totalReviews: number;
    features: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    orders: Order[];
    reviews: Review[];
}
