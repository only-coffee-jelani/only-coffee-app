import { User } from './user.entity';
import { Store } from './store.entity';
export declare class Review {
    id: string;
    userId: string;
    storeId: string;
    orderId: string | null;
    rating: number;
    comment: string | null;
    images: string[];
    isVerifiedPurchase: boolean;
    isVisible: boolean;
    helpfulCount: number;
    responseText: string | null;
    responseAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    store: Store;
}
